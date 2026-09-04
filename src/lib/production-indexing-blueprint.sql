-- ==============================================================================
-- ATTENDEX — PRODUCTION HIGH-CAPACITY INDEXING & QUERY OPTIMIZATION BLUEPRINT
-- Designed for: 500 Students | 500 Parents | 100 Faculty | 1 Administrator
-- Total Daily Telemetry: ~30,000 Attendance Rows/Day | High-Frequency Portal Reads
-- ==============================================================================

-- 1. Multi-Tenant Core Indexes
CREATE INDEX IF NOT EXISTS idx_classes_institution ON classes(institution_id, department_id);
CREATE INDEX IF NOT EXISTS idx_students_class_roll ON students(class_id, roll_number);
CREATE INDEX IF NOT EXISTS idx_students_institution ON students(institution_id, id);
CREATE INDEX IF NOT EXISTS idx_teachers_institution ON teachers(institution_id, id);
CREATE INDEX IF NOT EXISTS idx_parents_institution ON parents(institution_id, id);
CREATE INDEX IF NOT EXISTS idx_parent_student_rel ON parent_student_relationships(parent_id, student_id);

-- 2. High-Frequency Attendance Telemetry Indexes (B-Tree Composite)
CREATE INDEX IF NOT EXISTS idx_att_sessions_lookup ON attendance_sessions(class_id, subject_id, date, period);
CREATE INDEX IF NOT EXISTS idx_att_sessions_institution ON attendance_sessions(institution_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_att_records_session_student ON attendance_records(session_id, student_id, status);
CREATE INDEX IF NOT EXISTS idx_att_records_student_status ON attendance_records(student_id, status);

-- 3. Workflow Queues & State Filtering Indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_student_status ON leave_requests(student_id, status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_leave_requests_institution_pending ON leave_requests(institution_id, status) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_gatepasses_student_status ON gatepasses(student_id, status, exit_time DESC);
CREATE INDEX IF NOT EXISTS idx_gatepasses_institution_pending ON gatepasses(institution_id, status) WHERE status = 'PENDING';

-- 4. Academic Evaluation & Marks Indexes
CREATE INDEX IF NOT EXISTS idx_assessment_comp_subject ON assessment_components(subject_id, component_type);
CREATE INDEX IF NOT EXISTS idx_marks_student_comp ON marks(student_id, assessment_component_id);
CREATE INDEX IF NOT EXISTS idx_hall_tickets_student ON hall_tickets(student_id, semester, academic_year);

-- 5. Proctor Meetings & Zero-Collision Indexing
CREATE INDEX IF NOT EXISTS idx_proctor_meetings_date_slot ON proctor_meetings(meeting_date, student_id);
CREATE INDEX IF NOT EXISTS idx_proctor_assignments_active ON proctor_assignments(teacher_id, student_id, academic_year);

-- 6. Audit Logs & System Timeline
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_institution ON audit_logs(institution_id, created_at DESC);
