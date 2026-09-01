-- ============================================================================
-- ATTENDEX — DATABASE MIGRATION 04: 5-ROLE HIERARCHY & PRINCIPAL APPROVAL QUEUE
-- ============================================================================

-- 1. Create Approval Types & Status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_type') THEN
        CREATE TYPE approval_type AS ENUM (
            'LEAVE', 
            'GATEPASS', 
            'RESULT_PUBLICATION', 
            'PROMOTION', 
            'HALL_TICKET', 
            'ACADEMIC_CHANGE'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
        CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    END IF;
END $$;

-- 2. Create approval_requests table
CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    type approval_type NOT NULL,
    requested_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    target_id UUID,
    title TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    status approval_status DEFAULT 'PENDING',
    approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_approvals_inst_status ON approval_requests(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_approvals_type ON approval_requests(type);
CREATE INDEX IF NOT EXISTS idx_approvals_requested_by ON approval_requests(requested_by);

-- Row Level Security
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Principals can view and manage all approvals in institution"
    ON approval_requests FOR ALL
    USING (
        institution_id = get_auth_user_institution() AND 
        get_auth_user_role() IN ('PRINCIPAL', 'ADMIN', 'SUPER_ADMIN')
    );

CREATE POLICY "Users can view their own submitted approval requests"
    ON approval_requests FOR SELECT
    USING (requested_by = auth.uid() OR auth.uid() IS NULL);

CREATE POLICY "Users can create approval requests"
    ON approval_requests FOR INSERT
    WITH CHECK (requested_by = auth.uid() OR auth.uid() IS NULL);
