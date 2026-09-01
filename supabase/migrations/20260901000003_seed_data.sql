-- ============================================================================
-- ATTENDEX — DATABASE MIGRATION 03: REALISTIC INSTITUTIONAL SEED DATA
-- Multi-role institutional seed covering Admin, Teachers, Students & Parents
-- ============================================================================

-- ─── 1. INSTITUTION & SETTINGS ─────────────────────────────────────────────

INSERT INTO institutions (id, name, code, logo_url, current_academic_year, current_semester, min_attendance_threshold)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Global Institute of Technology & Engineering (GITE)',
    'GITE',
    '/icons/icon-192x192.png',
    '2026-2027',
    8,
    75.00
) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO institution_settings (institution_id, attendance_policy, branding)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '{"allow_self_checkin": false, "od_attendance_credit": true, "ml_attendance_credit": true, "defaulter_threshold": 75.0}',
    '{"primary_color": "#0f172a", "accent_color": "#2563eb", "college_motto": "Excellence in Academic Telemetry"}'
) ON CONFLICT (institution_id) DO NOTHING;

-- ─── 2. DEPARTMENTS & PROGRAMS ─────────────────────────────────────────────

INSERT INTO departments (id, institution_id, name, code) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Computer Science & Engineering', 'CSE'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Electronics & Communication', 'ECE'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Information Technology', 'IT')
ON CONFLICT (institution_id, code) DO NOTHING;

INSERT INTO programs (id, department_id, name, code, degree, duration_years) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'B.Tech Computer Science & Engineering', 'BT-CSE', 'B.Tech', 4),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'B.Tech Electronics & Communication', 'BT-ECE', 'B.Tech', 4)
ON CONFLICT (department_id, code) DO NOTHING;

INSERT INTO batches (id, program_id, start_year, end_year, name) VALUES
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 2023, 2027, 'Batch 2023-2027')
ON CONFLICT DO NOTHING;

INSERT INTO classes (id, institution_id, department_id, program_id, batch_id, name, section, year, semester, academic_year) VALUES
('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'B.Tech Computer Science', '4A', 4, 8, '2026-2027'),
('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'B.Tech Artificial Intelligence', '3B', 3, 6, '2026-2027'),
('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'B.Tech Electronics & Comm', '4B', 4, 8, '2026-2027')
ON CONFLICT DO NOTHING;

-- ─── 3. SUBJECTS ───────────────────────────────────────────────────────────

INSERT INTO subjects (id, institution_id, department_id, code, name, credits, semester, is_lab, color_code) VALUES
('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CS801', 'Distributed Systems & Cloud', 4, 8, FALSE, '#2563eb'),
('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'AI602', 'Deep Learning & Neural Nets Lab', 3, 6, TRUE, '#7c3aed'),
('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'EC801', 'VLSI Design & Hardware Lab', 4, 8, TRUE, '#d97706'),
('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'IT401', 'Database Architecture & SQL', 3, 4, FALSE, '#059669'),
('50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CS802', 'Algorithms & Complexity', 4, 8, FALSE, '#dc2626')
ON CONFLICT (institution_id, code) DO NOTHING;

-- ─── 4. USER PROFILES & FACULTY ────────────────────────────────────────────

INSERT INTO user_profiles (id, institution_id, role, email, full_name, phone, status) VALUES
('aa000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'ADMIN', 'admin@attendex.institution.edu', 'Dr. Ramesh Sundaram (Dean)', '+91 98765 00001', 'ACTIVE'),
('aa000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'TEACHER', 'faculty.cs@attendex.institution.edu', 'Prof. Arvind Sharma', '+91 98765 00002', 'ACTIVE'),
('aa000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'TEACHER', 'faculty.ec@attendex.institution.edu', 'Dr. Priya Kulkarni', '+91 98765 00003', 'ACTIVE'),
('aa000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'STUDENT', 'student.rahul@attendex.institution.edu', 'Rahul Deshmukh', '+91 98765 33333', 'ACTIVE'),
('aa000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'PARENT', 'parent.deshmukh@attendex.institution.edu', 'Sanjay Deshmukh', '+91 98765 99999', 'ACTIVE')
ON CONFLICT (institution_id, email) DO NOTHING;

INSERT INTO teachers (id, user_id, institution_id, department_id, employee_id, designation, cabin_location, office_hours) VALUES
('bb000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'EMP-CS-101', 'Professor & HOD', 'Cabin CS-402', 'Mon-Fri 3:30 PM - 5:00 PM'),
('bb000000-0000-0000-0000-000000000002', 'aa000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'EMP-EC-204', 'Associate Professor', 'Cabin EC-208', 'Tue-Thu 2:00 PM - 4:00 PM')
ON CONFLICT (institution_id, employee_id) DO NOTHING;

INSERT INTO teacher_subject_assignments (class_id, subject_id, teacher_id, academic_year, is_primary) VALUES
('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000001', '2026-2027', TRUE),
('40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', 'bb000000-0000-0000-0000-000000000002', '2026-2027', TRUE)
ON CONFLICT (class_id, subject_id, academic_year) DO NOTHING;

-- ─── 5. STUDENTS ───────────────────────────────────────────────────────────

INSERT INTO students (id, user_id, institution_id, class_id, roll_number, name, email, phone, cgpa, attendance_percentage, total_sessions, attended_sessions, status) VALUES
('cc000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '21CS042', 'Rahul Deshmukh', 'student.rahul@attendex.institution.edu', '+91 98765 33333', 9.12, 91.40, 140, 128, 'ACTIVE'),
('cc000000-0000-0000-0000-000000000002', NULL, '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '21CS001', 'Aarav Sharma', 'aarav.s@institution.edu', '+91 98765 11111', 9.45, 96.50, 140, 135, 'ACTIVE'),
('cc000000-0000-0000-0000-000000000003', NULL, '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '21CS002', 'Priya Patel', 'priya.p@institution.edu', '+91 98765 22222', 8.90, 94.00, 140, 132, 'ACTIVE'),
('cc000000-0000-0000-0000-000000000004', NULL, '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '21CS003', 'Ananya Iyer', 'ananya.i@institution.edu', '+91 98765 44444', 9.60, 98.00, 140, 137, 'ACTIVE'),
('cc000000-0000-0000-0000-000000000005', NULL, '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '21CS004', 'Vikram Malhotra', 'vikram.m@institution.edu', '+91 98765 55555', 6.80, 68.50, 140, 96, 'ACTIVE') -- Defaulter edge case
ON CONFLICT (institution_id, roll_number) DO NOTHING;

-- ─── 6. PARENTS & RELATIONSHIPS ────────────────────────────────────────────

INSERT INTO parents (id, user_id, institution_id, name, phone, email, relationship_type, emergency_contact) VALUES
('dd000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Sanjay Deshmukh', '+91 98765 99999', 'parent.deshmukh@attendex.institution.edu', 'Father', '+91 98765 99998')
ON CONFLICT (institution_id, phone) DO NOTHING;

INSERT INTO parent_student_relationships (parent_id, student_id, relationship, is_primary, is_verified) VALUES
('dd000000-0000-0000-0000-000000000001', 'cc000000-0000-0000-0000-000000000001', 'Father', TRUE, TRUE)
ON CONFLICT (parent_id, student_id) DO NOTHING;

-- ─── 7. PROCTOR ASSIGNMENTS ────────────────────────────────────────────────

INSERT INTO proctor_assignments (teacher_id, student_id, academic_year) VALUES
('bb000000-0000-0000-0000-000000000001', 'cc000000-0000-0000-0000-000000000001', '2026-2027')
ON CONFLICT (student_id, academic_year) DO NOTHING;

-- ─── 8. FEE STRUCTURES & STUDENT ACCOUNTS ──────────────────────────────────

INSERT INTO fee_structures (institution_id, department_id, semester, academic_year, tuition_fee, lab_fee, library_fee, exam_fee, total_fee) VALUES
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 8, '2026-2027', 65000.00, 12000.00, 5000.00, 3000.00, 85000.00)
ON CONFLICT (department_id, semester, academic_year) DO NOTHING;

INSERT INTO student_fee_accounts (id, institution_id, student_id, semester, academic_year, total_amount, paid_amount, due_amount, status) VALUES
('ee000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'cc000000-0000-0000-0000-000000000001', 8, '2026-2027', 85000.00, 85000.00, 0.00, 'PAID')
ON CONFLICT (student_id, semester, academic_year) DO NOTHING;

INSERT INTO fee_transactions (id, account_id, reference_number, amount, payment_mode, payment_date, receipt_number, recorded_by) VALUES
('ff000000-0000-0000-0000-000000000001', 'ee000000-0000-0000-0000-000000000001', 'TXN-UPI-2026-889102', 85000.00, 'ONLINE_UPI', '2026-08-10 11:30:00+05:30', 'REC-2026-8-042', 'aa000000-0000-0000-0000-000000000001')
ON CONFLICT (reference_number) DO NOTHING;

-- ─── 9. GATEPASSES & HALL TICKETS ──────────────────────────────────────────

INSERT INTO gatepasses (
    id, institution_id, student_id, category, departure_time, expected_return_time, reason, guardian_phone, guardian_sms_status, status, approved_by, approved_at, qr_token, nonce, expires_at
) VALUES (
    '11111111-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'cc000000-0000-0000-0000-000000000001',
    'WEEKEND',
    '2026-10-24 17:00:00+05:30',
    '2026-10-26 08:30:00+05:30',
    'Family weekend festival gathering at hometown',
    '+91 98765 99999',
    'SENT',
    'APPROVED',
    'aa000000-0000-0000-0000-000000000001',
    NOW(),
    'GP-2026-GITE-882104-TOKEN',
    'NONCE-99218201',
    '2026-10-26 12:00:00+05:30'
) ON CONFLICT (qr_token) DO NOTHING;

INSERT INTO hall_tickets (
    id, institution_id, student_id, semester, academic_year, exam_session, verification_token, is_eligible, eligibility_reasons, qr_token
) VALUES (
    '22222222-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'cc000000-0000-0000-0000-000000000001',
    8,
    '2026-2027',
    'Nov/Dec 2026 End-Semester Examinations',
    'HT-2026-21CS042-VERIFIED',
    TRUE,
    '{"attendance_percentage": 91.4, "attendance_cleared": true, "cia_cleared": true, "fees_cleared": true, "library_cleared": true}',
    'QR-HT-21CS042-AUTHTOKEN-9981'
) ON CONFLICT (student_id, semester, academic_year) DO NOTHING;
