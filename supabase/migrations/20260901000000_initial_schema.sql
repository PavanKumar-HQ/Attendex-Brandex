-- ============================================================================
-- ATTENDEX — DATABASE MIGRATION 00: INITIAL SCHEMA
-- Multi-tenant institutional academic & attendance operating system
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUMS ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'OD', 'ML', 'LATE', 'HOLIDAY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('OPEN', 'FINALIZED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_type AS ENUM ('MEDICAL', 'ON_DUTY', 'EMERGENCY', 'CASUAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gatepass_category AS ENUM ('WEEKEND', 'DAY_OUTING', 'MEDICAL', 'INDUSTRIAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gatepass_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'USED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE fee_status AS ENUM ('PAID', 'PARTIAL', 'DUE', 'OVERDUE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assessment_type AS ENUM ('CIA1', 'CIA2', 'TEST1', 'TEST2', 'ASSIGNMENT', 'LAB', 'SEMESTER_EXAM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE result_status AS ENUM ('PASS', 'FAIL', 'PROMOTED', 'WITHHELD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─── 1. INSTITUTIONS & MULTI-TENANT ROOTS ──────────────────────────────────

CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    current_academic_year TEXT NOT NULL DEFAULT '2026-2027',
    current_semester INT NOT NULL DEFAULT 8,
    min_attendance_threshold NUMERIC(5,2) NOT NULL DEFAULT 75.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institution_settings (
    institution_id UUID PRIMARY KEY REFERENCES institutions(id) ON DELETE CASCADE,
    attendance_policy JSONB NOT NULL DEFAULT '{"allow_self_checkin": false, "od_attendance_credit": true, "ml_attendance_credit": true, "defaulter_threshold": 75.0}',
    grading_scale JSONB NOT NULL DEFAULT '[{"grade": "O", "min": 90, "points": 10}, {"grade": "A+", "min": 80, "points": 9}, {"grade": "A", "min": 70, "points": 8}, {"grade": "B+", "min": 60, "points": 7}, {"grade": "B", "min": 55, "points": 6}, {"grade": "C", "min": 50, "points": 5}, {"grade": "F", "min": 0, "points": 0}]',
    period_timings JSONB NOT NULL DEFAULT '[{"period": 1, "start": "09:00", "end": "10:00"}, {"period": 2, "start": "10:00", "end": "11:00"}, {"period": 3, "start": "11:30", "end": "12:30"}, {"period": 4, "start": "12:30", "end": "13:30"}, {"period": 5, "start": "14:00", "end": "15:00"}, {"period": 6, "start": "15:00", "end": "16:00"}, {"period": 7, "start": "16:00", "end": "17:00"}]',
    branding JSONB NOT NULL DEFAULT '{"primary_color": "#0f172a", "accent_color": "#2563eb", "college_motto": "Excellence in Academic Engineering"}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. ACADEMIC STRUCTURE ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institution_id, code)
);

CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    degree TEXT NOT NULL DEFAULT 'B.Tech',
    duration_years INT NOT NULL DEFAULT 4,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(department_id, code)
);

CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    start_year INT NOT NULL,
    end_year INT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    section TEXT NOT NULL,
    year INT NOT NULL,
    semester INT NOT NULL,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institution_id, name, section, year, semester, academic_year)
);

-- ─── 3. USER PROFILES & ROLES ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY, -- references auth.users(id)
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    status account_status NOT NULL DEFAULT 'ACTIVE',
    passkey_bound BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institution_id, email)
);

CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL,
    designation TEXT NOT NULL DEFAULT 'Assistant Professor',
    cabin_location TEXT,
    office_hours TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institution_id, employee_id)
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL UNIQUE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    roll_number TEXT NOT NULL,
    register_number TEXT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    batch TEXT,
    cgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00,
    attendance_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    total_sessions INT NOT NULL DEFAULT 0,
    attended_sessions INT NOT NULL DEFAULT 0,
    status account_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institution_id, roll_number)
);

CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    relationship_type TEXT NOT NULL DEFAULT 'Guardian',
    emergency_contact TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institution_id, phone)
);

CREATE TABLE IF NOT EXISTS parent_student_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL DEFAULT 'Father',
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- ─── 4. SUBJECTS, ASSIGNMENTS & TIMETABLES ─────────────────────────────────

CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    credits INT NOT NULL DEFAULT 3,
    semester INT NOT NULL DEFAULT 1,
    is_lab BOOLEAN NOT NULL DEFAULT FALSE,
    color_code TEXT DEFAULT '#2563eb',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(institution_id, code)
);

CREATE TABLE IF NOT EXISTS teacher_subject_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(class_id, subject_id, academic_year) -- Hard relational lock prevents faculty collision
);

CREATE TABLE IF NOT EXISTS timetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    semester INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(class_id, academic_year, semester)
);

CREATE TABLE IF NOT EXISTS timetable_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_id UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Mon, 7=Sun
    period_number INT NOT NULL CHECK (period_number BETWEEN 1 AND 12),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(timetable_id, day_of_week, period_number)
);

-- ─── 5. ATTENDANCE ENGINE ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    period_number INT NOT NULL DEFAULT 1,
    lecture_type TEXT NOT NULL DEFAULT 'Theory',
    status session_status NOT NULL DEFAULT 'OPEN',
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finalized_at TIMESTAMPTZ,
    UNIQUE(class_id, subject_id, date, period_number)
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status attendance_status NOT NULL DEFAULT 'PRESENT',
    source TEXT NOT NULL DEFAULT 'WEB', -- WEB, ROPE_SYNC, BIOMETRIC
    marked_by UUID NOT NULL REFERENCES user_profiles(id),
    client_timestamp TIMESTAMPTZ,
    server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    applied_by_user_id UUID NOT NULL REFERENCES user_profiles(id),
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    document_url TEXT,
    status leave_status NOT NULL DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES user_profiles(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 6. ASSESSMENTS, MARKS & RESULTS ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS assessment_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type assessment_type NOT NULL,
    max_marks NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    weightage NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    semester INT NOT NULL,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(class_id, subject_id, name, semester, academic_year)
);

CREATE TABLE IF NOT EXISTS marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_component_id UUID NOT NULL REFERENCES assessment_components(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (marks_obtained >= 0),
    is_absent BOOLEAN NOT NULL DEFAULT FALSE,
    entered_by UUID NOT NULL REFERENCES user_profiles(id),
    entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(assessment_component_id, student_id)
);

CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester INT NOT NULL,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    sgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00,
    cgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00,
    total_credits INT NOT NULL DEFAULT 24,
    passed_credits INT NOT NULL DEFAULT 24,
    status result_status NOT NULL DEFAULT 'PASS',
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_by UUID NOT NULL REFERENCES user_profiles(id),
    UNIQUE(student_id, semester, academic_year)
);

-- ─── 7. STUDENT SERVICES: GATEPASS, HALL TICKETS & ASSIGNMENTS ─────────────

CREATE TABLE IF NOT EXISTS gatepasses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    category gatepass_category NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    expected_return_time TIMESTAMPTZ NOT NULL,
    actual_return_time TIMESTAMPTZ,
    reason TEXT NOT NULL,
    guardian_phone TEXT NOT NULL,
    guardian_sms_status TEXT NOT NULL DEFAULT 'SENT',
    status gatepass_status NOT NULL DEFAULT 'PENDING',
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMPTZ,
    qr_token TEXT NOT NULL UNIQUE,
    nonce TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gatepass_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gatepass_id UUID NOT NULL REFERENCES gatepasses(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- ISSUED, APPROVED, EXITED, RETURNED, CANCELLED
    scanned_by UUID REFERENCES user_profiles(id),
    gate_location TEXT NOT NULL DEFAULT 'Main Campus Gate 1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hall_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester INT NOT NULL,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    exam_session TEXT NOT NULL DEFAULT 'Nov/Dec 2026 End-Semester',
    verification_token TEXT NOT NULL UNIQUE,
    is_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    eligibility_reasons JSONB DEFAULT '{"attendance_cleared": true, "cia_cleared": true, "fees_cleared": true}',
    qr_token TEXT NOT NULL UNIQUE,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    downloaded_at TIMESTAMPTZ,
    UNIQUE(student_id, semester, academic_year)
);

CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    max_marks NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    rubric_url TEXT,
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    submission_url TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    marks_awarded NUMERIC(5,2),
    graded_by UUID REFERENCES user_profiles(id),
    graded_at TIMESTAMPTZ,
    feedback TEXT,
    status TEXT NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED, GRADED, LATE
    UNIQUE(assignment_id, student_id)
);

-- ─── 8. FEES, NOTIFICATIONS, PROCTORS & MERITS ─────────────────────────────

CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    semester INT NOT NULL,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    tuition_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    lab_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    library_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    exam_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(department_id, semester, academic_year)
);

CREATE TABLE IF NOT EXISTS student_fee_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester INT NOT NULL,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    due_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status fee_status NOT NULL DEFAULT 'DUE',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, semester, academic_year)
);

CREATE TABLE IF NOT EXISTS fee_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES student_fee_accounts(id) ON DELETE CASCADE,
    reference_number TEXT NOT NULL UNIQUE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_mode TEXT NOT NULL DEFAULT 'ONLINE_UPI',
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    receipt_number TEXT NOT NULL UNIQUE,
    receipt_url TEXT,
    recorded_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proctor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, academic_year)
);

CREATE TABLE IF NOT EXISTS proctor_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proctor_assignment_id UUID NOT NULL REFERENCES proctor_assignments(id) ON DELETE CASCADE,
    meeting_date DATE NOT NULL,
    agenda TEXT NOT NULL,
    notes TEXT,
    action_items TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conduct_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'Merit', -- Merit, Commendation, Disciplinary
    title TEXT NOT NULL,
    description TEXT,
    points_xp INT NOT NULL DEFAULT 0,
    awarded_by UUID NOT NULL REFERENCES user_profiles(id),
    date_awarded DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS curriculum_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    unit_number INT NOT NULL CHECK (unit_number BETWEEN 1 AND 10),
    unit_title TEXT NOT NULL,
    topics TEXT NOT NULL,
    slides_url TEXT,
    pyq_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(subject_id, unit_number)
);

CREATE TABLE IF NOT EXISTS placement_drives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    ctc_package TEXT NOT NULL,
    drive_date DATE NOT NULL,
    min_cgpa NUMERIC(4,2) NOT NULL DEFAULT 7.00,
    min_attendance NUMERIC(5,2) NOT NULL DEFAULT 75.00,
    max_backlogs INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES user_profiles(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'ACADEMIC',
    priority TEXT NOT NULL DEFAULT 'NORMAL',
    deduplication_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    recipient_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(notification_id, recipient_user_id)
);

-- ─── 9. IMMUTABLE AUDIT LOGS & IDEMPOTENCY ──────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES user_profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
    key TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    operation TEXT NOT NULL,
    response_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ─── 10. INDEXES FOR PERFORMANCE ──────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_profiles_inst_role ON user_profiles(institution_id, role);
CREATE INDEX IF NOT EXISTS idx_students_class_inst ON students(class_id, institution_id);
CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_date ON attendance_sessions(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_component ON marks(assessment_component_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_parent ON parent_student_relationships(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_student ON parent_student_relationships(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipients ON notification_recipients(recipient_user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_inst ON audit_logs(institution_id, created_at DESC);
