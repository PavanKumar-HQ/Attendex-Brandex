# 🏛️ ATTENDEX — System Architecture & Engineering Standard

Attendex is a multi-tenant institutional academic and attendance operating system designed with high cohesion, strict Row Level Security, relational offline persistence, and event-driven synchronization.

---

## 1. High-Level Architectural Diagram

```text
                  Client Layer (PWA / Mobile / Desktop)
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
   Faculty Portal           Student Portal          Parent Portal
   - Roll-Call Sheet        - Live Telemetry        - Multi-Ward Roster
   - Continuous Marks       - Safe Skips Calc       - Leave Approvals
   - Institutional Pulse    - Gatepass & QR Nonce   - Fee Ledgers
          │                       │                       │
          └───────────────────────┬───────────────────────┘
                                  │
               Next.js 16 App Router (Turbopack + SSR)
                                  │
    ┌─────────────────────────────┼─────────────────────────────┐
    │                             │                             │
Authoritative Guards       Pure Domain Math              ROPE Engine
(Session & RLS Tokens)  (Attendance & SGPA Scale)   (IndexedDB Sync Queue)
    │                             │                             │
    └─────────────────────────────┬─────────────────────────────┘
                                  │
             Supabase PostgreSQL 15 & RPC Transactions
                                  │
    ┌─────────────────────────────┼─────────────────────────────┐
    │                             │                             │
Multi-Tenant Schema       Row Level Security         Realtime Channels
(UUID + Hard Locks)      (Role-Based Isolation)    (Filtered Cache Inval)
```

---

## 2. Core Architectural Pillars

### 2.1 Multi-Tenant Institutional Boundary
Every core relational entity (`classes`, `students`, `teachers`, `subjects`, `attendance_sessions`, `fee_structures`, `audit_logs`) enforces an immutable `institution_id` foreign key.

### 2.2 Relational Subject Locking
Faculty cannot record attendance or submit continuous assessment marks for unauthorized courses. The `teacher_subject_assignments` table acts as a relational lock enforced by database constraints and Row Level Security policies.

### 2.3 Single Source of Truth
No critical academic or financial state exists purely in client memory or unverified React context. All state hydrates from PostgreSQL via strongly typed queries or is processed through atomic PostgreSQL RPCs (`submit_attendance_session`, `sync_offline_rope_queue`, `verify_gatepass_token`).

### 2.4 Relational Offline Persistence Engine (ROPE)
When internet connectivity is severed during a classroom lecture:
1. Faculty roll-call submissions are validated locally and buffered into IndexedDB with a unique cryptographic `operation_id`.
2. When connectivity restores, mutations are batch-processed by the `sync_offline_rope_queue` RPC with optimistic concurrency protection.

---

## 3. Directory Layout & Layer Responsibilities

```text
src/
├── app/                  # Next.js App Router (45 Routes across Faculty, Student, Parent, Public)
├── components/           # Reusable UI primitives, Modals, Shells & Navigators
├── hooks/                # Custom React Hooks (useRealtime, useAcademic, useWebAuthn)
├── lib/
│   ├── calculations.ts   # Pure mathematical rules (Safe Skips, Recovery, SGPA, Grades)
│   ├── auth-guard.ts     # Authoritative session context & role checks
│   ├── supabase.ts       # Universal Supabase client with production timeouts
│   ├── errors.ts         # AppError hierarchy with typed error codes
│   └── validators.ts     # Zod runtime schema validators
├── services/             # Application Services (Attendance, Academic, StudentServices, Offline, Registry)
└── types/                # Central TypeScript domain definitions & contracts
```
