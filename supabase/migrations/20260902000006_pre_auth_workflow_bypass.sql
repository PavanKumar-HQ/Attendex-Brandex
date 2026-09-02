-- ============================================================================
-- ATTENDEX — MIGRATION 06: WORKFLOW BYPASS FOR PRE-AUTH DEVELOPMENT
-- Temporarily allows anon API to read/write leave_requests and gatepasses
-- until real Supabase Auth is wired up. Also adds student_name column
-- so GET responses return real names instead of hardcoded "Rahul Deshmukh".
-- ============================================================================

-- 1. Add student_name to leave_requests (for display without JOIN)
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS class_name TEXT;

-- 2. Add student_name to gatepasses (for display without JOIN)
ALTER TABLE gatepasses ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE gatepasses ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE gatepasses ADD COLUMN IF NOT EXISTS destination TEXT;

-- 3. Drop the old restrictive RLS policies on leave_requests
DROP POLICY IF EXISTS "Students can view and create own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Parents can view and create leave requests for wards" ON leave_requests;
DROP POLICY IF EXISTS "Teachers and Admins can review leave requests" ON leave_requests;

-- 4. Replace with open policies that allow the API layer (anon key)
--    to operate until real Supabase Auth sessions are wired up.
CREATE POLICY "API layer: full access to leave_requests"
    ON leave_requests FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

-- 5. Drop the old restrictive RLS policies on gatepasses
DROP POLICY IF EXISTS "Students can manage own gatepasses" ON gatepasses;
DROP POLICY IF EXISTS "Parents can read ward gatepasses" ON gatepasses;
DROP POLICY IF EXISTS "Teachers and Admins can review gatepasses" ON gatepasses;

-- 6. Replace with open policies
CREATE POLICY "API layer: full access to gatepasses"
    ON gatepasses FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

-- 7. Open audit_logs for API writes (was already open for INSERT)
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "API layer: full access to audit_logs"
    ON audit_logs FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

-- 8. Open attendance tables for API writes
DROP POLICY IF EXISTS "Teachers and Admins can insert/update attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Students can read own attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Parents can read linked ward attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Teachers and Admins can read attendance records" ON attendance_records;

CREATE POLICY "API layer: full access to attendance_records"
    ON attendance_records FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Teachers and Admins can manage attendance sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "Users can view attendance sessions" ON attendance_sessions;

CREATE POLICY "API layer: full access to attendance_sessions"
    ON attendance_sessions FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

-- 9. Open marks / assessment for API writes
DROP POLICY IF EXISTS "Teachers and Admins can manage marks" ON marks;
DROP POLICY IF EXISTS "Students can read own marks" ON marks;
DROP POLICY IF EXISTS "Parents can read ward marks" ON marks;

CREATE POLICY "API layer: full access to marks"
    ON marks FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Teachers and Admins can manage assessment_components" ON assessment_components;

CREATE POLICY "API layer: full access to assessment_components"
    ON assessment_components FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);
