# 🗄️ ATTENDEX — PostgreSQL & Supabase Database Architecture

Attendex is backed by a PostgreSQL 15 database running on Supabase with strict foreign key constraints, Row Level Security, performance indexes, and transactional RPC functions.

---

## 1. Relational Entities Summary

| Table | Purpose | Multi-Tenant Key | Primary Key |
| :--- | :--- | :--- | :--- |
| `institutions` | Top-level academic tenant entity | `id` | `UUID` |
| `departments` | Academic branches (CSE, ECE, ME, etc.) | `institution_id` | `UUID` |
| `programs` | Degree offerings (B.Tech, M.Tech, MBA) | `department_id` | `UUID` |
| `classes` | Cohort sections (e.g. B.Tech CS 4A) | `institution_id` | `UUID` |
| `subjects` | Course catalog with syllabus credits | `institution_id` | `UUID` |
| `teacher_subject_assignments`| Relational faculty course locks | `teacher_id` | `UUID` |
| `user_profiles` | RBAC user metadata (`ADMIN`, `TEACHER`, `STUDENT`, `PARENT`) | `institution_id` | `UUID` |
| `students` | Student roster with USN, roll number & cached stats | `institution_id` | `UUID` |
| `parents` | Guardian contact profiles | `institution_id` | `UUID` |
| `parent_student_relationships`| Verified ward relationships | Foreign Keys | `UUID` |
| `attendance_sessions` | Lecture period roll-call master records | `institution_id` | `UUID` |
| `attendance_records` | Individual student statuses (`PRESENT`, `ABSENT`, `OD`, `ML`) | `session_id` | `UUID` |
| `gatepasses` | Out-pass tokens with QR nonces & timestamps | `student_id` | `UUID` |
| `student_fee_accounts` | Tuition & hostel billing balances | `student_id` | `UUID` |
| `audit_logs` | Immutable tamper-proof institutional ledger | `institution_id` | `UUID` |
| `idempotency_keys` | Duplicate request suppression vault | `key` | `UUID` |

---

## 2. Core RPCs & Stored Procedures

1. **`submit_attendance_session`**:
   * *Signature*: `(p_class_id, p_subject_id, p_teacher_id, p_date, p_period, p_lecture_type, p_records, p_operation_id, p_client_version)`
   * *Atomic Behavior*: Verifies teacher lock, prevents duplicate execution via idempotency key, records attendance rows, triggers percentage roll-ups, creates audit logs, and checks defaulter limits in a single transaction.

2. **`sync_offline_rope_queue`**:
   * *Signature*: `(p_teacher_id, p_mutations)`
   * *Atomic Behavior*: Sequentially applies buffered IndexedDB offline roll-calls, detecting version conflicts and returning per-session sync receipts.

3. **`verify_gatepass_token`**:
   * *Signature*: `(p_token, p_security_guard_id, p_action_type)`
   * *Atomic Behavior*: Validates QR token nonce, checks expiration, updates state to `EXIT_RECORDED` or `ENTRY_RECORDED`, and writes `gatepass_events`.

4. **`apply_leave_approval`**:
   * *Signature*: `(p_leave_id, p_approver_id, p_status, p_comments)`
   * *Atomic Behavior*: Approves medical/duty leave requests and updates matching attendance records to `ML`/`OD`.

5. **`calculate_student_results`**:
   * *Signature*: `(p_student_id, p_semester_id)`
   * *Atomic Behavior*: Computes credit-weighted SGPA and updates student cumulative academic standing.
