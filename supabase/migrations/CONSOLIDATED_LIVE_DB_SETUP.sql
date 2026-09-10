-- ============================================================================
-- ATTENDEX: CONSOLIDATED PRODUCTION DATABASE SETUP & SYNCHRONIZATION
-- Run this script in the Supabase SQL Editor to link every section of the
-- application with live PostgreSQL tables without RLS 42501 errors.
-- ============================================================================

-- ─── 1. ENUM EXTENSIONS ──────────────────────────────────────────────────────
ALTER TYPE assessment_type ADD VALUE IF NOT EXISTS 'CIA';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'PRINCIPAL';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

-- ─── 2. SCHEMA EXTENSIONS ────────────────────────────────────────────────────
-- Students extensions
ALTER TABLE students ADD COLUMN IF NOT EXISTS dob TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS formatted_dob TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS salt TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_email TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS hostel TEXT;

-- User profiles extensions
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS salt TEXT;

-- Leave requests metadata extensions
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS class_name TEXT;

-- Gatepasses metadata extensions
ALTER TABLE gatepasses ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE gatepasses ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE gatepasses ADD COLUMN IF NOT EXISTS destination TEXT;

-- ─── 3. PERMISSIVE API-LAYER RLS POLICIES FOR ALL TABLES ─────────────────────
-- Disable blocking RLS or grant full access for application API operations

-- Students
DROP POLICY IF EXISTS "API layer: full access to students" ON students;
CREATE POLICY "API layer: full access to students" ON students FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- User Profiles
DROP POLICY IF EXISTS "API layer: full access to user_profiles" ON user_profiles;
CREATE POLICY "API layer: full access to user_profiles" ON user_profiles FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Teachers
DROP POLICY IF EXISTS "API layer: full access to teachers" ON teachers;
CREATE POLICY "API layer: full access to teachers" ON teachers FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Parents
DROP POLICY IF EXISTS "API layer: full access to parents" ON parents;
CREATE POLICY "API layer: full access to parents" ON parents FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Classes
DROP POLICY IF EXISTS "API layer: full access to classes" ON classes;
CREATE POLICY "API layer: full access to classes" ON classes FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Departments
DROP POLICY IF EXISTS "API layer: full access to departments" ON departments;
CREATE POLICY "API layer: full access to departments" ON departments FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Programs
DROP POLICY IF EXISTS "API layer: full access to programs" ON programs;
CREATE POLICY "API layer: full access to programs" ON programs FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Batches
DROP POLICY IF EXISTS "API layer: full access to batches" ON batches;
CREATE POLICY "API layer: full access to batches" ON batches FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Subjects
DROP POLICY IF EXISTS "API layer: full access to subjects" ON subjects;
CREATE POLICY "API layer: full access to subjects" ON subjects FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Attendance Sessions & Records
DROP POLICY IF EXISTS "API layer: full access to attendance_sessions" ON attendance_sessions;
CREATE POLICY "API layer: full access to attendance_sessions" ON attendance_sessions FOR ALL USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "API layer: full access to attendance_records" ON attendance_records;
CREATE POLICY "API layer: full access to attendance_records" ON attendance_records FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Leave Requests
DROP POLICY IF EXISTS "API layer: full access to leave_requests" ON leave_requests;
CREATE POLICY "API layer: full access to leave_requests" ON leave_requests FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Gatepasses
DROP POLICY IF EXISTS "API layer: full access to gatepasses" ON gatepasses;
CREATE POLICY "API layer: full access to gatepasses" ON gatepasses FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Assessment Components & Marks
DROP POLICY IF EXISTS "API layer: full access to assessment_components" ON assessment_components;
CREATE POLICY "API layer: full access to assessment_components" ON assessment_components FOR ALL USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "API layer: full access to marks" ON marks;
CREATE POLICY "API layer: full access to marks" ON marks FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Notifications & Audit Logs
DROP POLICY IF EXISTS "API layer: full access to notifications" ON notifications;
CREATE POLICY "API layer: full access to notifications" ON notifications FOR ALL USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "API layer: full access to audit_logs" ON audit_logs;
CREATE POLICY "API layer: full access to audit_logs" ON audit_logs FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ─── 4. SEED CORE DEPARTMENTS, PROGRAMS, BATCHES & CLASSES ───────────────────
INSERT INTO departments (id, institution_id, name, code) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Computer Science & Engineering', 'CSE'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Electronics & Communication', 'ECE'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Information Technology', 'IT'),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Artificial Intelligence & Data Science', 'AI')
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO programs (id, department_id, name, code, degree, duration_years) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'B.Tech Computer Science & Engineering', 'BT-CSE', 'B.Tech', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO batches (id, program_id, start_year, end_year, name) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 2024, 2028, 'Batch 2024-2028')
ON CONFLICT (id) DO NOTHING;

INSERT INTO classes (id, institution_id, department_id, program_id, batch_id, name, section, year, semester, academic_year) VALUES
('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'B.Tech Computer Science', 'CS-A', 2, 4, '2026-2027'),
('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'B.Tech Computer Science', 'CS-B', 2, 4, '2026-2027')
ON CONFLICT (id) DO NOTHING;

-- ─── 5. SEED SUBJECTS ────────────────────────────────────────────────────────
INSERT INTO subjects (id, institution_id, department_id, code, name, credits, semester, is_lab, color_code) VALUES
('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CS401', 'Database Management Systems & SQL Lab', 4, 4, true, '#2563eb'),
('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CS402', 'Operating Systems & Kernel Development', 4, 4, false, '#4f46e5'),
('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CS403', 'Computer Networks & Protocol Security', 3, 4, false, '#059669'),
('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CS404', 'Distributed Systems & Cloud Computing', 4, 4, false, '#d97706'),
('50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CS405', 'Design & Analysis of Algorithms', 4, 4, false, '#dc2626')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    credits = EXCLUDED.credits;

-- ─── 6. SEED USER PROFILES (STAFF & ADMIN) ───────────────────────────────────
INSERT INTO user_profiles (id, institution_id, role, email, full_name, phone, password_hash, salt, status) VALUES
('aa000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'ADMIN', 'admin@attendex.institution.edu', 'Dr. Ramesh Sundaram (Dean)', '+91 98765 00001', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'attendex_sec_salt_2026', 'ACTIVE'),
('aa000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'TEACHER', 'faculty.cs@attendex.institution.edu', 'Prof. Arvind Sharma', '+91 98765 00002', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'attendex_sec_salt_2026', 'ACTIVE'),
('aa000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'PRINCIPAL', 'principal@attendex.edu', 'Dr. K. S. Prabhakar', '+91 98765 00005', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'attendex_sec_salt_2026', 'ACTIVE'),
('aa000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'PARENT', 'parent.deshmukh@attendex.institution.edu', 'Sanjay Deshmukh', '+91 98765 99999', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'attendex_sec_salt_2026', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash;

-- ─── 7. SEED TEACHERS ────────────────────────────────────────────────────────
INSERT INTO teachers (id, user_id, institution_id, department_id, employee_id, designation, cabin_location) VALUES
('bb000000-0000-0000-0000-000000000002', 'aa000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'FAC-CS-001', 'Associate Professor', 'Block C - Room 304')
ON CONFLICT (id) DO NOTHING;

-- ─── 8. SEED CORE STUDENTS DIRECTORY ─────────────────────────────────────────
INSERT INTO students (
    id, institution_id, class_id, roll_number, register_number, name, email, phone,
    dob, formatted_dob, password_hash, salt, cgpa, attendance_percentage,
    total_sessions, attended_sessions, parent_name, parent_email, parent_phone, hostel, status
) VALUES
('cc000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
 'CS-11', 'REG2024CS011', 'Aarav Sharma', 'aarav.sharma@attendex.edu', '+91 98450 11011',
 '15082004', '15/08/2004', '69fa5b5dc4e297800ba8b61c940c6c21e646fa33c706222b406e25ea459ad268', 'attendex_sec_salt_2026',
 9.25, 94.00, 60, 56, 'Ramesh Sharma', 'ramesh.sharma@example.com', '+91 98450 11010', 'Cauvery Boys Hostel — Block A (Room 102)', 'ACTIVE'),

('cc000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
 'CS-12', 'REG2024CS012', 'Ishani Patel', 'ishani.patel@attendex.edu', '+91 98450 11012',
 '22032004', '22/03/2004', 'b37fe5d8ecfdbd05ff452c1e7a6839aaebdb4a806967f08e42f638fcfa5d4fa5', 'attendex_sec_salt_2026',
 8.80, 87.00, 60, 52, 'Mahesh Patel', 'mahesh.patel@example.com', '+91 98450 11009', 'Sharavathi Girls Hostel — Block B (Room 205)', 'ACTIVE'),

('cc000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002',
 'CS-13', 'REG2024CS013', 'Vihaan Gupta', 'vihaan.gupta@attendex.edu', '+91 98450 11013',
 '10112003', '10/11/2003', 'b9b4f979720d2ecb2b73eeeb0268595cb62fa112d7cbe9426f4fce867dae0ecb', 'attendex_sec_salt_2026',
 8.10, 79.00, 60, 47, 'Rajeev Gupta', 'rajeev.gupta@example.com', '+91 98450 11008', 'Krishna Boys Hostel — Block C (Room 304)', 'ACTIVE'),

('cc000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002',
 'CS-14', 'REG2024CS014', 'Ananya Iyer', 'ananya.iyer@attendex.edu', '+91 98450 11014',
 '05012004', '05/01/2004', '0da520ffbe326b527ba766c6244ca7ea859556828555e7178c1879c8d578ec09', 'attendex_sec_salt_2026',
 9.40, 91.00, 60, 55, 'Subramanian Iyer', 'subramanian.iyer@example.com', '+91 98450 11007', 'Sharavathi Girls Hostel — Block A (Room 110)', 'ACTIVE'),

('cc000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
 'CS-15', 'REG2024CS015', 'Arjun Reddy', 'arjun.reddy@attendex.edu', '+91 98450 11015',
 '18092003', '18/09/2003', 'e7b0a70243beea5098ffb4d24a9197c3fe5df3a3cb91104e7cb803a60a8863f6', 'attendex_sec_salt_2026',
 8.35, 83.00, 60, 50, 'Prabhakar Reddy', 'prabhakar.reddy@example.com', '+91 98450 11006', 'Cauvery Boys Hostel — Block B (Room 214)', 'ACTIVE'),

('cc000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
 'CS-23', 'REG2024CS023', 'Ayush Tiwari', 'ayush.tiwari@attendex.edu', '+91 98450 11023',
 '14042004', '14/04/2004', '87c2aa5b0d0cbbcfcb096fe35ba057be05f5630d8d08c5c46ca33dbb98f2441d', 'attendex_sec_salt_2026',
 6.80, 66.00, 60, 40, 'Manoj Tiwari', 'manoj.tiwari@example.com', '+91 98450 10998', 'Krishna Boys Hostel — Block B (Room 118)', 'ACTIVE'),

('cc000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
 '21CS042', 'REG2021CS042', 'Rahul Deshmukh', 'student.rahul@attendex.institution.edu', '+91 98765 33333',
 '08062003', '08/06/2003', '1f5a542bdf04432d43aa5145b23eb91f531952e4250da7d2645eb48ca09e8648', 'attendex_sec_salt_2026',
 9.12, 91.40, 140, 128, 'Sanjay Deshmukh', 'parent.deshmukh@attendex.institution.edu', '+91 98765 99999', 'Block A - Room 402, Campus Residence', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    dob = EXCLUDED.dob,
    formatted_dob = EXCLUDED.formatted_dob,
    password_hash = EXCLUDED.password_hash,
    attendance_percentage = EXCLUDED.attendance_percentage,
    cgpa = EXCLUDED.cgpa,
    parent_name = EXCLUDED.parent_name,
    parent_phone = EXCLUDED.parent_phone,
    hostel = EXCLUDED.hostel;
