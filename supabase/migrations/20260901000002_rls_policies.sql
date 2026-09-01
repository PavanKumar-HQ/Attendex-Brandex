-- ============================================================================
-- ATTENDEX — DATABASE MIGRATION 02: ROW LEVEL SECURITY (RLS) POLICIES
-- Strict multi-role security across ADMIN, TEACHER, STUDENT, and PARENT
-- ============================================================================

-- ─── 1. ENABLE RLS ON ALL TABLES ───────────────────────────────────────────

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE gatepasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE gatepass_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fee_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctor_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conduct_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── 2. INSTITUTIONS & DEPARTMENTS ─────────────────────────────────────────

CREATE POLICY "Users can read their own institution"
    ON institutions FOR SELECT
    USING (id = get_auth_user_institution() OR auth.uid() IS NULL);

CREATE POLICY "Admins can update their own institution"
    ON institutions FOR UPDATE
    USING (id = get_auth_user_institution() AND get_auth_user_role() = 'ADMIN');

CREATE POLICY "Users can read departments in institution"
    ON departments FOR SELECT
    USING (institution_id = get_auth_user_institution() OR auth.uid() IS NULL);

CREATE POLICY "Users can read classes in institution"
    ON classes FOR SELECT
    USING (institution_id = get_auth_user_institution() OR auth.uid() IS NULL);

CREATE POLICY "Admins can manage classes"
    ON classes FOR ALL
    USING (institution_id = get_auth_user_institution() AND get_auth_user_role() = 'ADMIN');

-- ─── 3. USER PROFILES ──────────────────────────────────────────────────────

CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (id = auth.uid() OR get_auth_user_role() = 'ADMIN');

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Admins can manage user profiles"
    ON user_profiles FOR ALL
    USING (get_auth_user_role() = 'ADMIN' AND institution_id = get_auth_user_institution());

-- ─── 4. STUDENTS & PARENTS ─────────────────────────────────────────────────

CREATE POLICY "Students can view own record"
    ON students FOR SELECT
    USING (user_id = auth.uid() OR get_auth_user_role() IN ('ADMIN', 'TEACHER') OR auth.uid() IS NULL);

CREATE POLICY "Parents can view linked verified wards"
    ON students FOR SELECT
    USING (id IN (SELECT student_id FROM get_auth_parent_student_ids()));

CREATE POLICY "Admins can manage students"
    ON students FOR ALL
    USING (get_auth_user_role() = 'ADMIN' AND institution_id = get_auth_user_institution());

CREATE POLICY "Parents can view own record"
    ON parents FOR SELECT
    USING (user_id = auth.uid() OR get_auth_user_role() = 'ADMIN');

CREATE POLICY "Parents and students can view relationships"
    ON parent_student_relationships FOR SELECT
    USING (
        parent_id IN (SELECT id FROM parents WHERE user_id = auth.uid()) OR
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid()) OR
        get_auth_user_role() = 'ADMIN'
    );

-- ─── 5. SUBJECTS & TIMETABLE ───────────────────────────────────────────────

CREATE POLICY "Users can read subjects"
    ON subjects FOR SELECT
    USING (institution_id = get_auth_user_institution() OR auth.uid() IS NULL);

CREATE POLICY "Admins can manage subjects"
    ON subjects FOR ALL
    USING (institution_id = get_auth_user_institution() AND get_auth_user_role() = 'ADMIN');

CREATE POLICY "Users can read timetables"
    ON timetables FOR SELECT
    USING (institution_id = get_auth_user_institution());

CREATE POLICY "Users can read timetable entries"
    ON timetable_entries FOR SELECT
    USING (TRUE);

-- ─── 6. ATTENDANCE ENGINE (CRITICAL SECURITY) ──────────────────────────────

CREATE POLICY "Students can read own attendance records"
    ON attendance_records FOR SELECT
    USING (student_id = get_auth_student_id());

CREATE POLICY "Parents can read linked ward attendance records"
    ON attendance_records FOR SELECT
    USING (student_id IN (SELECT student_id FROM get_auth_parent_student_ids()));

CREATE POLICY "Teachers and Admins can read attendance records"
    ON attendance_records FOR SELECT
    USING (get_auth_user_role() IN ('TEACHER', 'ADMIN'));

CREATE POLICY "Teachers and Admins can insert/update attendance records"
    ON attendance_records FOR ALL
    USING (get_auth_user_role() IN ('TEACHER', 'ADMIN'));

CREATE POLICY "Users can view attendance sessions"
    ON attendance_sessions FOR SELECT
    USING (institution_id = get_auth_user_institution());

CREATE POLICY "Teachers and Admins can manage attendance sessions"
    ON attendance_sessions FOR ALL
    USING (get_auth_user_role() IN ('TEACHER', 'ADMIN'));

-- ─── 7. LEAVE REQUESTS ─────────────────────────────────────────────────────

CREATE POLICY "Students can view and create own leave requests"
    ON leave_requests FOR ALL
    USING (student_id = get_auth_student_id() OR applied_by_user_id = auth.uid());

CREATE POLICY "Parents can view and create leave requests for wards"
    ON leave_requests FOR ALL
    USING (student_id IN (SELECT student_id FROM get_auth_parent_student_ids()));

CREATE POLICY "Teachers and Admins can review leave requests"
    ON leave_requests FOR ALL
    USING (get_auth_user_role() IN ('TEACHER', 'ADMIN') AND institution_id = get_auth_user_institution());

-- ─── 8. MARKS & RESULTS ────────────────────────────────────────────────────

CREATE POLICY "Students can read own marks"
    ON marks FOR SELECT
    USING (student_id = get_auth_student_id());

CREATE POLICY "Parents can read ward marks"
    ON marks FOR SELECT
    USING (student_id IN (SELECT student_id FROM get_auth_parent_student_ids()));

CREATE POLICY "Teachers and Admins can manage marks"
    ON marks FOR ALL
    USING (get_auth_user_role() IN ('TEACHER', 'ADMIN'));

CREATE POLICY "Students can read own results"
    ON results FOR SELECT
    USING (student_id = get_auth_student_id());

CREATE POLICY "Parents can read ward results"
    ON results FOR SELECT
    USING (student_id IN (SELECT student_id FROM get_auth_parent_student_ids()));

CREATE POLICY "Admins and Teachers can view all results"
    ON results FOR SELECT
    USING (get_auth_user_role() IN ('TEACHER', 'ADMIN'));

-- ─── 9. GATEPASSES & HALL TICKETS ──────────────────────────────────────────

CREATE POLICY "Students can manage own gatepasses"
    ON gatepasses FOR ALL
    USING (student_id = get_auth_student_id());

CREATE POLICY "Parents can read ward gatepasses"
    ON gatepasses FOR SELECT
    USING (student_id IN (SELECT student_id FROM get_auth_parent_student_ids()));

CREATE POLICY "Teachers and Admins can review gatepasses"
    ON gatepasses FOR ALL
    USING (get_auth_user_role() IN ('TEACHER', 'ADMIN'));

CREATE POLICY "Students can read own hall ticket"
    ON hall_tickets FOR SELECT
    USING (student_id = get_auth_student_id());

CREATE POLICY "Parents can read ward hall ticket"
    ON hall_tickets FOR SELECT
    USING (student_id IN (SELECT student_id FROM get_auth_parent_student_ids()));

CREATE POLICY "Admins can manage hall tickets"
    ON hall_tickets FOR ALL
    USING (get_auth_user_role() = 'ADMIN');

-- ─── 10. FEES (FINANCIAL IMMUTABILITY) ──────────────────────────────────────

CREATE POLICY "Students can read own fee account"
    ON student_fee_accounts FOR SELECT
    USING (student_id = get_auth_student_id());

CREATE POLICY "Parents can read ward fee account"
    ON student_fee_accounts FOR SELECT
    USING (student_id IN (SELECT student_id FROM get_auth_parent_student_ids()));

CREATE POLICY "Admins can manage fee accounts"
    ON student_fee_accounts FOR ALL
    USING (get_auth_user_role() = 'ADMIN');

CREATE POLICY "Students and parents can read fee transactions"
    ON fee_transactions FOR SELECT
    USING (
        account_id IN (SELECT id FROM student_fee_accounts WHERE student_id = get_auth_student_id()) OR
        account_id IN (SELECT id FROM student_fee_accounts WHERE student_id IN (SELECT student_id FROM get_auth_parent_student_ids())) OR
        get_auth_user_role() = 'ADMIN'
    );

-- ─── 11. NOTIFICATIONS ─────────────────────────────────────────────────────

CREATE POLICY "Users can read own notification recipients"
    ON notification_recipients FOR ALL
    USING (recipient_user_id = auth.uid());

CREATE POLICY "Users can read notifications sent to them"
    ON notifications FOR SELECT
    USING (
        id IN (SELECT notification_id FROM notification_recipients WHERE recipient_user_id = auth.uid()) OR
        sender_id = auth.uid() OR
        get_auth_user_role() = 'ADMIN'
    );

-- ─── 12. AUDIT LOGS (IMMUTABLE) ────────────────────────────────────────────

CREATE POLICY "Admins can read audit logs"
    ON audit_logs FOR SELECT
    USING (get_auth_user_role() = 'ADMIN' AND institution_id = get_auth_user_institution());

CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (TRUE);
