# 🔄 ATTENDEX — End-to-End Data Flow Specifications

This document outlines the step-by-step transaction flow across critical subsystems in Attendex.

---

## 1. Faculty Roll-Call & Realtime Synchronization

```text
[Faculty Action]
    │ 1. Submits Attendance Roll-Call for Class B.Tech CS 4A
    ▼
[Application Service]
    │ 2. attendanceService.submitAttendance(sessionPayload)
    │ 3. Generates unique idempotency operation_id (UUID v4)
    ▼
[PostgreSQL RPC: submit_attendance_session]
    │ 4. Verifies teacher assignment in teacher_subject_assignments
    │ 5. Checks idempotency_keys (prevents duplicate submission)
    │ 6. Writes attendance_sessions & attendance_records
    │ 7. recalculate_student_attendance() automatically updates students.attendance_percentage
    │ 8. Defaulter Alert Check (< 75% triggers instant parent SMS dispatch queue)
    │ 9. Inserts audit_logs record
    ▼
[Supabase Realtime Channel]
    │ 10. Broadcasts postgres_changes event on attendance_records
    ▼
[Student & Parent Portals]
    │ 11. useRealtime hook receives event -> Query cache invalidated
    │ 12. Student attendance circle & safe skips re-render instantly without refresh
```

---

## 2. Relational Offline Persistence (ROPE) Batch Synchronization

```text
[Faculty in Offline Lecture Hall (No Network)]
    │ 1. Teacher records attendance & clicks Submit
    ▼
[Application Service: offlineService.saveDraft]
    │ 2. Buffers session in IndexedDB ('attendex_offline_vault')
    │ 3. UI enters 'Buffered / Offline Vault' state with amber badge
    ▼
[Network Connectivity Restored (window 'online' event)]
    │ 4. Background synchronization trigger invokes flushQueue()
    ▼
[PostgreSQL RPC: sync_offline_rope_queue]
    │ 5. Batch iterates over buffered mutations
    │ 6. Verifies version conflict & idempotency
    │ 7. Commits sessions atomically
    │ 8. Local IndexedDB queue marks entries as SYNCED
```

---

## 3. Cryptographic Digital Gatepass Workflow

```text
[Student Applies for Out-Pass]
    │ 1. studentServices.applyGatepass(reason, exit_time)
    ▼
[Warden / HOD Approval]
    │ 2. Authority reviews & signs gatepass in dashboard
    │ 3. System creates gatepass record with unique QR Token Nonce
    ▼
[Security Gate Scan]
    │ 4. Security Guard scans Student QR Code
    ▼
[PostgreSQL RPC: verify_gatepass_token]
    │ 5. Validates token signature, expiration & single-use nonce
    │ 6. Updates status to 'EXIT_RECORDED'
    │ 7. Inserts immutable gatepass_events log
    │ 8. Guardian receives entry/exit SMS notification
```
