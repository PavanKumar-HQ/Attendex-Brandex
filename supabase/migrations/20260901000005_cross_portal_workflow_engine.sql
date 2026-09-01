-- ============================================================================
-- ATTENDEX — DATABASE MIGRATION 05: UNIFIED CROSS-PORTAL WORKFLOW & APPROVAL ENGINE
-- ============================================================================

-- 1. Custom Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_type_enum') THEN
        CREATE TYPE leave_type_enum AS ENUM ('MEDICAL', 'ON_DUTY', 'FAMILY_EMERGENCY', 'SPORTS', 'CASUAL');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_status_enum') THEN
        CREATE TYPE workflow_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_adjustment_enum') THEN
        CREATE TYPE attendance_adjustment_enum AS ENUM ('CONDONED', 'EXCUSED', 'ON_DUTY', 'MEDICAL');
    END IF;
END $$;

-- 2. Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    leave_type leave_type_enum NOT NULL DEFAULT 'MEDICAL',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status workflow_status_enum NOT NULL DEFAULT 'PENDING',
    decided_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ,
    decision_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

-- 3. Gatepass Requests Table
CREATE TABLE IF NOT EXISTS gatepass_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    exit_time TIMESTAMPTZ NOT NULL,
    expected_return TIMESTAMPTZ NOT NULL,
    destination TEXT NOT NULL,
    reason TEXT NOT NULL,
    emergency_contact TEXT NOT NULL,
    qr_nonce TEXT UNIQUE,
    status workflow_status_enum NOT NULL DEFAULT 'PENDING',
    approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Unified Approval Tasks Table (Workflow Coordinator)
CREATE TABLE IF NOT EXISTS approval_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL, -- 'LEAVE', 'GATEPASS', 'RESULT', 'PROMOTION'
    request_id UUID NOT NULL,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    assigned_role TEXT NOT NULL DEFAULT 'TEACHER', -- 'TEACHER', 'PRINCIPAL'
    status workflow_status_enum NOT NULL DEFAULT 'PENDING',
    decided_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ,
    decision_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Attendance Adjustments (Preserves Historical Roll-Calls)
CREATE TABLE IF NOT EXISTS attendance_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    leave_request_id UUID REFERENCES leave_requests(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    adjustment_type attendance_adjustment_enum NOT NULL DEFAULT 'CONDONED',
    reason TEXT,
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_leave_student ON leave_requests(student_id, status);
CREATE INDEX IF NOT EXISTS idx_gatepass_student ON gatepass_requests(student_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON approval_tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_adjustments_student ON attendance_adjustments(student_id, session_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);

-- 7. Atomic Concurrency Decision RPC (First-Valid-Action Wins)
CREATE OR REPLACE FUNCTION process_approval_task_decision(
    p_task_id UUID,
    p_decision TEXT, -- 'APPROVED' or 'REJECTED'
    p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_task approval_tasks%ROWTYPE;
    v_decided_status workflow_status_enum;
BEGIN
    v_decided_status := p_decision::workflow_status_enum;

    -- Optimistic Concurrency Update
    UPDATE approval_tasks
    SET status = v_decided_status,
        decided_by = auth.uid(),
        decided_at = now(),
        decision_comment = p_comment,
        updated_at = now()
    WHERE id = p_task_id AND status = 'PENDING'
    RETURNING * INTO v_task;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'CONFLICT',
            'message', 'Request has already been processed by another reviewer.'
        );
    END IF;

    -- Update linked domain table
    IF v_task.request_type = 'LEAVE' THEN
        UPDATE leave_requests
        SET status = v_decided_status,
            decided_by = auth.uid(),
            decided_at = now(),
            decision_reason = p_comment,
            updated_at = now()
        WHERE id = v_task.request_id;
    ELSIF v_task.request_type = 'GATEPASS' THEN
        UPDATE gatepass_requests
        SET status = v_decided_status,
            approved_by = auth.uid(),
            approved_at = now(),
            rejection_reason = p_comment,
            updated_at = now()
        WHERE id = v_task.request_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'task_id', v_task.id,
        'status', v_decided_status,
        'message', 'Decision recorded successfully.'
    );
END;
$$;
