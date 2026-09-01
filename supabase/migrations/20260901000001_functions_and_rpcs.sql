-- ============================================================================
-- ATTENDEX — DATABASE MIGRATION 01: FUNCTIONS, RPCS & AUDIT TRIGGERS
-- ============================================================================

-- ─── 1. SECURITY & IDENTITY CONTEXT HELPERS ─────────────────────────────────

CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS user_role AS $$
    SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_auth_user_institution()
RETURNS UUID AS $$
    SELECT institution_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_auth_student_id()
RETURNS UUID AS $$
    SELECT id FROM students WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_auth_teacher_id()
RETURNS UUID AS $$
    SELECT id FROM teachers WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_auth_parent_student_ids()
RETURNS TABLE(student_id UUID) AS $$
    SELECT psr.student_id 
    FROM parent_student_relationships psr
    JOIN parents p ON p.id = psr.parent_id
    WHERE p.user_id = auth.uid() AND psr.is_verified = TRUE;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─── 2. RECALCULATE STUDENT ATTENDANCE STATS ───────────────────────────────

CREATE OR REPLACE FUNCTION recalculate_student_attendance(p_student_id UUID)
RETURNS TABLE(total_sessions INT, attended_sessions INT, attendance_percentage NUMERIC) AS $$
DECLARE
    v_total INT;
    v_attended INT;
    v_pct NUMERIC(5,2);
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status IN ('PRESENT', 'OD', 'ML', 'LATE'))
    INTO v_total, v_attended
    FROM attendance_records
    WHERE student_id = p_student_id;

    IF v_total = 0 THEN
        v_pct := 100.00;
    ELSE
        v_pct := ROUND(((v_attended::NUMERIC / v_total::NUMERIC) * 100.0), 2);
    END IF;

    UPDATE students
    SET 
        total_sessions = v_total,
        attended_sessions = v_attended,
        attendance_percentage = v_pct,
        updated_at = NOW()
    WHERE id = p_student_id;

    RETURN QUERY SELECT v_total, v_attended, v_pct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 3. ATOMIC ATTENDANCE SESSION SUBMISSION RPC ────────────────────────────

CREATE OR REPLACE FUNCTION submit_attendance_session(
    p_class_id UUID,
    p_subject_id UUID,
    p_period INT,
    p_date DATE,
    p_records JSONB, -- Array of { "student_id": "...", "status": "PRESENT"|"ABSENT"|"OD"|"ML" }
    p_operation_id TEXT DEFAULT NULL,
    p_client_version INT DEFAULT 1,
    p_lecture_type TEXT DEFAULT 'Theory'
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_institution_id UUID;
    v_teacher_id UUID;
    v_session_id UUID;
    v_existing_version INT;
    v_rec JSONB;
    v_student_id UUID;
    v_status attendance_status;
    v_student_count INT := 0;
    v_absent_count INT := 0;
    v_cached_response JSONB;
    v_student_pct NUMERIC;
    v_student_name TEXT;
    v_subject_name TEXT;
BEGIN
    -- 1. Idempotency check
    IF p_operation_id IS NOT NULL THEN
        SELECT response_payload INTO v_cached_response
        FROM idempotency_keys
        WHERE key = p_operation_id AND user_id = v_user_id;

        IF v_cached_response IS NOT NULL THEN
            RETURN v_cached_response;
        END IF;
    END IF;

    -- 2. Validate user profile & role
    SELECT institution_id INTO v_institution_id FROM user_profiles WHERE id = v_user_id;
    IF v_institution_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED: User profile not found in institution';
    END IF;

    SELECT id INTO v_teacher_id FROM teachers WHERE user_id = v_user_id;
    
    -- Admin override if not faculty
    IF v_teacher_id IS NULL THEN
        IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = v_user_id AND role = 'ADMIN') THEN
            RAISE EXCEPTION 'FORBIDDEN: User is not authorized to submit attendance';
        END IF;
        -- Use assigned teacher for this subject or current admin
        SELECT teacher_id INTO v_teacher_id 
        FROM teacher_subject_assignments 
        WHERE class_id = p_class_id AND subject_id = p_subject_id LIMIT 1;
    END IF;

    -- 3. Upsert session with optimistic locking
    SELECT id, version INTO v_session_id, v_existing_version
    FROM attendance_sessions
    WHERE class_id = p_class_id AND subject_id = p_subject_id AND date = p_date AND period_number = p_period;

    IF v_session_id IS NOT NULL THEN
        IF p_client_version < v_existing_version THEN
            RETURN jsonb_build_object(
                'status', 'CONFLICT',
                'message', 'Session was modified elsewhere. Please refresh before saving.',
                'server_version', v_existing_version
            );
        END IF;

        UPDATE attendance_sessions
        SET 
            version = version + 1,
            finalized_at = NOW(),
            status = 'FINALIZED'
        WHERE id = v_session_id
        RETURNING version INTO v_existing_version;
    ELSE
        INSERT INTO attendance_sessions (
            institution_id, class_id, subject_id, teacher_id, date, period_number, lecture_type, status, created_by, version, finalized_at
        ) VALUES (
            v_institution_id, p_class_id, p_subject_id, COALESCE(v_teacher_id, (SELECT id FROM teachers LIMIT 1)), p_date, p_period, p_lecture_type, 'FINALIZED', v_user_id, 1, NOW()
        ) RETURNING id, version INTO v_session_id, v_existing_version;
    END IF;

    -- 4. Process individual attendance records
    FOR v_rec IN SELECT * FROM jsonb_array_elements(p_records)
    LOOP
        v_student_id := (v_rec->>'student_id')::UUID;
        v_status := (v_rec->>'status')::attendance_status;

        INSERT INTO attendance_records (
            session_id, student_id, status, source, marked_by, client_timestamp, server_timestamp, version
        ) VALUES (
            v_session_id, v_student_id, v_status, COALESCE(v_rec->>'source', 'WEB'), v_user_id, NOW(), NOW(), v_existing_version
        )
        ON CONFLICT (session_id, student_id)
        DO UPDATE SET
            status = EXCLUDED.status,
            source = EXCLUDED.source,
            marked_by = EXCLUDED.marked_by,
            version = attendance_records.version + 1,
            updated_at = NOW();

        -- Recalculate attendance stats for this student
        PERFORM recalculate_student_attendance(v_student_id);

        v_student_count := v_student_count + 1;
        IF v_status = 'ABSENT' THEN
            v_absent_count := v_absent_count + 1;

            -- Check defaulter threshold & send notification if below 75%
            SELECT attendance_percentage, name INTO v_student_pct, v_student_name FROM students WHERE id = v_student_id;
            SELECT name INTO v_subject_name FROM subjects WHERE id = p_subject_id;

            IF v_student_pct < 75.00 THEN
                -- Insert deduplicated notification
                INSERT INTO notifications (
                    institution_id, sender_id, title, message, category, priority, deduplication_key
                ) VALUES (
                    v_institution_id, v_user_id, 'Attendance Defaulter Warning (<75%)',
                    v_student_name || ' was marked Absent in ' || v_subject_name || ' on ' || p_date::TEXT || '. Current attendance is ' || v_student_pct::TEXT || '%.',
                    'ATTENDANCE', 'HIGH',
                    'defaulter:' || v_student_id::TEXT || ':' || p_date::TEXT
                ) ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END LOOP;

    -- 5. Build response payload
    v_cached_response := jsonb_build_object(
        'status', 'SUCCESS',
        'session_id', v_session_id,
        'version', v_existing_version,
        'student_count', v_student_count,
        'absent_count', v_absent_count,
        'server_timestamp', NOW()
    );

    -- 6. Store idempotency key
    IF p_operation_id IS NOT NULL THEN
        INSERT INTO idempotency_keys (key, user_id, operation, response_payload)
        VALUES (p_operation_id, v_user_id, 'submit_attendance', v_cached_response)
        ON CONFLICT (key) DO UPDATE SET response_payload = EXCLUDED.response_payload;
    END IF;

    -- 7. Audit log event
    INSERT INTO audit_logs (
        institution_id, actor_user_id, action, entity_type, entity_id, new_values
    ) VALUES (
        v_institution_id, v_user_id, 'SUBMIT_ATTENDANCE', 'attendance_session', v_session_id::TEXT,
        jsonb_build_object('class_id', p_class_id, 'subject_id', p_subject_id, 'date', p_date, 'period', p_period, 'total', v_student_count, 'absent', v_absent_count)
    );

    RETURN v_cached_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 4. SYNC OFFLINE ROPE QUEUE RPC ────────────────────────────────────────

CREATE OR REPLACE FUNCTION sync_offline_rope_queue(
    p_batch JSONB -- Array of { operation_id, class_id, subject_id, period, date, records, client_version }
)
RETURNS JSONB AS $$
DECLARE
    v_item JSONB;
    v_results JSONB := '[]'::JSONB;
    v_item_res JSONB;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_batch)
    LOOP
        BEGIN
            v_item_res := submit_attendance_session(
                (v_item->>'class_id')::UUID,
                (v_item->>'subject_id')::UUID,
                (v_item->>'period')::INT,
                (v_item->>'date')::DATE,
                v_item->'records',
                v_item->>'operation_id',
                COALESCE((v_item->>'client_version')::INT, 1),
                COALESCE(v_item->>'lecture_type', 'Theory')
            );
            v_results := v_results || jsonb_build_object('operation_id', v_item->>'operation_id', 'result', v_item_res);
        EXCEPTION WHEN OTHERS THEN
            v_results := v_results || jsonb_build_object('operation_id', v_item->>'operation_id', 'status', 'ERROR', 'error', SQLERRM);
        END;
    END LOOP;

    RETURN jsonb_build_object('batch_size', jsonb_array_length(p_batch), 'results', v_results);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 5. VERIFY GATEPASS TOKEN RPC ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION verify_gatepass_token(
    p_token TEXT,
    p_gate_location TEXT DEFAULT 'Main Campus Gate 1'
)
RETURNS JSONB AS $$
DECLARE
    v_gatepass gatepasses%ROWTYPE;
    v_student students%ROWTYPE;
    v_scanner_id UUID := auth.uid();
BEGIN
    SELECT * INTO v_gatepass FROM gatepasses WHERE qr_token = p_token OR nonce = p_token;

    IF v_gatepass.id IS NULL THEN
        RETURN jsonb_build_object('valid', FALSE, 'reason', 'INVALID_TOKEN', 'message', 'Gatepass token not found in registry');
    END IF;

    IF v_gatepass.status = 'EXPIRED' OR v_gatepass.expires_at < NOW() THEN
        UPDATE gatepasses SET status = 'EXPIRED' WHERE id = v_gatepass.id;
        RETURN jsonb_build_object('valid', FALSE, 'reason', 'EXPIRED', 'message', 'This gatepass has expired');
    END IF;

    IF v_gatepass.status = 'CANCELLED' OR v_gatepass.status = 'REJECTED' THEN
        RETURN jsonb_build_object('valid', FALSE, 'reason', 'INVALID_STATUS', 'message', 'Pass was rejected or cancelled');
    END IF;

    IF v_gatepass.status = 'USED' THEN
        -- Record returning event
        UPDATE gatepasses SET actual_return_time = NOW() WHERE id = v_gatepass.id;
        INSERT INTO gatepass_events (gatepass_id, event_type, scanned_by, gate_location)
        VALUES (v_gatepass.id, 'RETURNED', v_scanner_id, p_gate_location);
        
        RETURN jsonb_build_object(
            'valid', TRUE,
            'event', 'RETURNED',
            'message', 'Student campus return check-in verified',
            'return_time', NOW()
        );
    END IF;

    -- First exit scan
    UPDATE gatepasses SET status = 'USED' WHERE id = v_gatepass.id;
    INSERT INTO gatepass_events (gatepass_id, event_type, scanned_by, gate_location)
    VALUES (v_gatepass.id, 'EXITED', v_scanner_id, p_gate_location);

    SELECT * INTO v_student FROM students WHERE id = v_gatepass.student_id;

    RETURN jsonb_build_object(
        'valid', TRUE,
        'event', 'EXITED',
        'student_name', v_student.name,
        'roll_number', v_student.roll_number,
        'category', v_gatepass.category,
        'expected_return', v_gatepass.expected_return_time,
        'message', 'Security gate exit authorization approved'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 6. APPLY LEAVE APPROVAL & ATTENDANCE CONDONATION RPC ───────────────────

CREATE OR REPLACE FUNCTION apply_leave_approval(
    p_leave_id UUID,
    p_decision TEXT, -- 'APPROVED' or 'REJECTED'
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_leave leave_requests%ROWTYPE;
    v_reviewer_id UUID := auth.uid();
    v_new_status attendance_status;
BEGIN
    SELECT * INTO v_leave FROM leave_requests WHERE id = p_leave_id;
    IF v_leave.id IS NULL THEN
        RAISE EXCEPTION 'NOT_FOUND: Leave request not found';
    END IF;

    IF p_decision = 'APPROVED' THEN
        UPDATE leave_requests
        SET status = 'APPROVED', reviewed_by = v_reviewer_id, reviewed_at = NOW(), review_notes = p_notes
        WHERE id = p_leave_id;

        -- Map leave type to attendance status
        IF v_leave.leave_type = 'MEDICAL' THEN
            v_new_status := 'ML';
        ELSIF v_leave.leave_type = 'ON_DUTY' THEN
            v_new_status := 'OD';
        ELSE
            v_new_status := 'PRESENT';
        END IF;

        -- Update attendance records in date range
        UPDATE attendance_records ar
        SET status = v_new_status, updated_at = NOW()
        FROM attendance_sessions s
        WHERE ar.session_id = s.id
          AND ar.student_id = v_leave.student_id
          AND s.date BETWEEN v_leave.start_date AND v_leave.end_date
          AND ar.status = 'ABSENT';

        -- Recalculate student attendance
        PERFORM recalculate_student_attendance(v_leave.student_id);
    ELSE
        UPDATE leave_requests
        SET status = 'REJECTED', reviewed_by = v_reviewer_id, reviewed_at = NOW(), review_notes = p_notes
        WHERE id = p_leave_id;
    END IF;

    RETURN jsonb_build_object('status', 'SUCCESS', 'leave_id', p_leave_id, 'decision', p_decision);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 7. CALCULATE STUDENT RESULTS (SGPA / CGPA) RPC ─────────────────────────

CREATE OR REPLACE FUNCTION calculate_student_results(
    p_student_id UUID,
    p_semester INT,
    p_academic_year TEXT DEFAULT '2026-2027'
)
RETURNS JSONB AS $$
DECLARE
    v_student students%ROWTYPE;
    v_total_points NUMERIC(6,2) := 0;
    v_total_credits INT := 0;
    v_passed_credits INT := 0;
    v_sgpa NUMERIC(4,2);
    v_row RECORD;
    v_score NUMERIC;
    v_grade_points NUMERIC;
    v_status result_status := 'PASS';
BEGIN
    SELECT * INTO v_student FROM students WHERE id = p_student_id;
    IF v_student.id IS NULL THEN
        RAISE EXCEPTION 'Student not found';
    END IF;

    FOR v_row IN 
        SELECT 
            s.id AS subject_id,
            s.name,
            s.credits,
            COALESCE(SUM(m.marks_obtained), 0) AS total_marks,
            COALESCE(SUM(ac.max_marks), 100) AS total_max
        FROM subjects s
        JOIN assessment_components ac ON ac.subject_id = s.id AND ac.semester = p_semester AND ac.academic_year = p_academic_year
        LEFT JOIN marks m ON m.assessment_component_id = ac.id AND m.student_id = p_student_id
        WHERE s.semester = p_semester
        GROUP BY s.id, s.name, s.credits
    LOOP
        v_score := (v_row.total_marks / NULLIF(v_row.total_max, 0)) * 100;
        
        -- Grade Point Mapping (O=10, A+=9, A=8, B+=7, B=6, C=5, F=0)
        IF v_score >= 90 THEN v_grade_points := 10;
        ELSIF v_score >= 80 THEN v_grade_points := 9;
        ELSIF v_score >= 70 THEN v_grade_points := 8;
        ELSIF v_score >= 60 THEN v_grade_points := 7;
        ELSIF v_score >= 55 THEN v_grade_points := 6;
        ELSIF v_score >= 50 THEN v_grade_points := 5;
        ELSE 
            v_grade_points := 0;
            v_status := 'FAIL';
        END IF;

        IF v_grade_points > 0 THEN
            v_passed_credits := v_passed_credits + v_row.credits;
        END IF;

        v_total_points := v_total_points + (v_grade_points * v_row.credits);
        v_total_credits := v_total_credits + v_row.credits;
    END LOOP;

    IF v_total_credits = 0 THEN
        v_sgpa := 0.00;
    ELSE
        v_sgpa := ROUND((v_total_points / v_total_credits::NUMERIC), 2);
    END IF;

    -- Upsert results table
    INSERT INTO results (
        institution_id, student_id, semester, academic_year, sgpa, cgpa, total_credits, passed_credits, status, published_by
    ) VALUES (
        v_student.institution_id, p_student_id, p_semester, p_academic_year, v_sgpa, v_sgpa, v_total_credits, v_passed_credits, v_status, auth.uid()
    ) ON CONFLICT (student_id, semester, academic_year) DO UPDATE SET
        sgpa = EXCLUDED.sgpa,
        cgpa = EXCLUDED.cgpa,
        total_credits = EXCLUDED.total_credits,
        passed_credits = EXCLUDED.passed_credits,
        status = EXCLUDED.status,
        published_at = NOW();

    -- Update student CGPA
    UPDATE students SET cgpa = v_sgpa WHERE id = p_student_id;

    RETURN jsonb_build_object('student_id', p_student_id, 'sgpa', v_sgpa, 'status', v_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
