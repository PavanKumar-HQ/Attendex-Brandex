# 🎓 Attendex: Next-Generation Institutional Academic & Attendance Operating System

[![Next.js](https://img.shields.io/badge/Next.js-16.2_(Turbopack)-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Installable_Native_App-8A2BE2)](https://web.dev/progressive-web-apps/)
[![PDF Engine](https://img.shields.io/badge/PDF_Engine-jsPDF_&_AutoTable-red)](https://github.com/parallax/jsPDF)
[![Security](https://img.shields.io/badge/Security-RBAC_&_CSP_Hardened-emerald)](./SECURITY.md)

**Attendex** is an institutional-grade educational command platform and telemetry system engineered for modern universities, colleges, and schools. It bridges administration, faculty, students, and guardians into a unified, data-driven academic ecosystem with offline-first roll call capabilities, automated 75% attendance rule enforcement, digital examination admit cards, cryptographic campus gatepasses, fee ledgers, and institutional PDF transcripts.

---

## 🏛️ System Portals & Comprehensive Feature Breakdown

```
                                  ┌─────────────────────────────┐
                                  │       ATTENDEX CORE         │
                                  │  Unified Campus OS & DB     │
                                  └──────────────┬──────────────┘
                    ┌────────────────────────────┼────────────────────────────┐
                    ▼                            ▼                            ▼
      ┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
      │      FACULTY & ADMIN      │ │      STUDENT PORTAL       │ │      GUARDIAN PORTAL      │
      │ • Live Attendance Pulse   │ │ • Safe Margin Simulator   │ │ • Daily Lecture Telemetry │
      │ • Subject Relational Lock │ │ • Digital Hall Ticket Pass│ │ • Tuition & Fee Ledger    │
      │ • Batch Defaulter SMS     │ │ • Coursework & Lab Hub    │ │ • Medical Exemption Desk  │
      │ • CIA Marks & Grading     │ │ • Campus Digital Gatepass │ │ • Proctor Advisory Hub    │
      │ • Timetable CSV Engine    │ │ • PYQs & Syllabus Notes   │ │ • Discipline & Conduct    │
      └───────────────────────────┘ └───────────────────────────┘ └───────────────────────────┘
```

---

## 👨‍🏫 1. Faculty & Administrative Command Center

The Faculty and Admin Portal equips educators and department deans with high-velocity tools to manage classes, record attendance without friction, and enforce institutional compliance.

### Key Capabilities:
* **Rapid Touch Attendance Marking (`/attendance`)**:
  * Dual-mode recording: Touch-friendly **List View** with keyboard quick-entry (e.g. `001, 005, 012` for instant absent marking) and high-density **Grid View**.
  * Multi-period lecture slot tracking (`L1`–`L8` and Double Periods `DP1`–`DP2`).
  * Instant **"Mark All Present"** toggle and per-student **On-Duty (OD)** / **Medical Leave (ML)** status indicators.
* **Relational Offline Persistence Engine (ROPE)**:
  * Designed for campus basements, workshops, and cellular dead zones.
  * Local relational caching of attendance records with zero data loss and background synchronization upon signal recovery.
* **Subject Data Sovereignty & Relational Lock**:
  * Relational locking on `(subject_id, class_id)` guarantees primary faculty ownership and prevents collision or accidental overwrites.
* **Campus Attendance Pulse (`/pulse`)**:
  * Live telemetry stream visualizing active lectures, real-time departmental turnout, and hourly campus check-ins.
* **Batch Defaulter Guardian Notification (`/dashboard` & `/notifications`)**:
  * 1-click batch SMS & portal alert dispatch to guardians of students falling below the mandatory 75% attendance threshold.
  * Audience targeting: *All Portals*, *Defaulter Guardians (<75%)*, or *Specific Department Cohorts*.
* **Continuous Internal Assessment (CIA) & Marks Manager (`/results/manage` & `/results`)**:
  * Multi-component evaluation (CIA-1, CIA-2, Lab Practicum, Assignment weightage).
  * Auto-calculated SGPA/CGPA with University grade ledger compilation.
* **Schedule & Timetable Engine (`/timetable`)**:
  * Interactive day-by-day class scheduler with room allocation and faculty mapping.
  * **Bulk CSV Import Engine** with pre-configured template download for semester timetables.
* **Student Promotion & Batch Transition (`/promotion`)**:
  * End-of-year cohort migration tool promoting eligible students to subsequent semesters.
* **Immutable Audit & Security Trail (`/audit`)**:
  * Cryptographic audit logging of every attendance alteration, grade modification, and login event.
* **Campus Gamification & Sports Merits (`/leaderboard` & `/sports`)**:
  * Student academic XP leaderboard and extracurricular/sports achievement registry.

---

## 🎓 2. Student Portal & Academic Passport

A dedicated student command hub giving learners real-time transparency over their academic standing, examination passes, and daily campus life.

### Key Capabilities:
* **Real-Time Academic Dashboard (`/student/dashboard`)**:
  * Live aggregate attendance ratio with instant visual standing indicator (*Good Standing* / *Attendance Shortage*).
  * CIA average marks, Continuous Assessment points, and Sports XP.
* **Attendance Safe Margin & Buffer Simulator (`/student/calculator`)**:
  * Interactive University 75% Rule calculation engine.
  * **"Safe Skips Remaining"**: Calculates the exact number of future lectures a student can afford to miss without dropping below 75%.
  * **"Catch-Up Recovery Classes"**: Computes consecutive classes required to restore eligibility if attendance has fallen into the danger zone.
* **Digital Examination Hall Ticket Pass (`/student/hall-ticket`)**:
  * Cryptographically verified QR admit card for End-Semester Examinations.
  * Authorized exam timetable matrix (Paper Codes, Date, Timing, Assigned Campus Hall).
  * **1-Click Official Hall Ticket PDF Generator** and **Print Pass** actions.
* **Campus Digital Gatepass & Outpass System (`/student/gatepass`)**:
  * Apply for *Weekend Hostel Outpass*, *Day Outing*, *Medical Clinic Exit*, or *Industrial Project Visits*.
  * Automated SMS notification to registered guardian contact.
  * **Live QR Security Token** formatted for campus main gates and biometric hostel turnstiles.
  * **Download Digital Gatepass (PDF)**.
* **Course Curriculum & Digital Notes Hub (`/student/curriculum`)**:
  * Complete unit-by-unit syllabus breakdown (Units 1–5) across all enrolled courses.
  * Downloadable faculty lecture slides (PDF) and **Previous Year Question Papers (PYQs)**.
* **Coursework & Practical Lab Tracker (`/student/assignments`)**:
  * Continuous internal evaluation assignment submission portal.
  * Filter by *All*, *In Progress*, *Submitted*, and *Graded* with faculty scorecards and rubric downloads.
* **Career & Placement Readiness Hub (`/student/placement`)**:
  * Real-time campus drive eligibility badge (CGPA $\ge 7.5$, Attendance $\ge 75\%$, Zero Backlogs).
  * Tier-1 recruiter listings (*Google, Microsoft, Goldman Sachs*) with test dates, CTC packages, and seat booking.
  * Resume verification tracker and mock interview scheduling.
* **Individual Attendance Audit Ledger (`/student/history`)**:
  * Detailed session-by-session lecture log.
  * **Interactive Week Bar** with day-by-day filtering and attendance status dots (🟢 Present, 🔴 Absent, ⚪ Holiday).
  * **1-Click Download Official Attendance Statement (PDF)**.
* **Official Marksheet Generator (`/student/marks`)**:
  * Tabular breakdown of CIA scores, Lab performance, attendance weightage, and final grades with **Download Marksheet (PDF)**.
* **Student Identity & Services Profile (`/student/profile`)**:
  * University ID reissue requests, credential security reset, and guardian profile management.

---

## 👨‍👩‍👧 3. Guardian & Parent Portal

A transparent, high-fidelity portal keeping parents and guardians informed regarding their child's academic progress, daily lecture telemetry, and institutional dues.

### Key Capabilities:
* **Guardian Executive Dashboard (`/parent/dashboard`)**:
  * Real-time attendance health telemetry with standardized `/20` CIA scale normalization.
  * Designated Faculty Proctor profile card (*Dr. Pavan Kulkarni, CS HOD*) with direct call & email triggers.
  * Hall Ticket Clearance Checklist (Attendance, CIA completion, Library dues).
* **Tuition Fee Ledger & Clearance Certificates (`/parent/fees`)**:
  * Itemized breakdown of Semester Tuition, Laboratory deposit, Examination, and Digital Library fees.
  * Transaction history with unique bank reference tokens.
  * **1-Click Download Official Fee Clearance & Tax Exemption Certificate (PDF)** (Section 80C compliant).
* **Official Absence & Medical Exemption Application (`/parent/leave`)**:
  * Formal leave application portal supporting *Medical Leave (ML)* with prescription upload, *On-Duty (OD)* sports representation, and *Family Emergency*.
  * Transparent approval timeline with automated attendance condonation credit upon proctor verification.
* **Faculty Proctor Advisory & Callback Booking (`/parent/proctor`)**:
  * Proctor office hours, cabin location, and direct inquiry submission form.
  * Historical advisory meeting logs and behavioral recommendations.
* **Daily Attendance Telemetry Log (`/parent/history`)**:
  * Day-by-day lecture attendance breakdown with interactive weekly date selector and **Export Guardian Statement (PDF)**.
* **Institutional Academic Calendar & Milestones (`/parent/calendar`)**:
  * Full semester schedule tracking CIA exam weeks, Parent-Teacher Consultation (PTM) slots, and semester breaks.
  * **Sync to Device Calendar (iCal)** and **Download Academic Calendar (PDF)**.
* **Student Conduct & Merits Ledger (`/parent/conduct`)**:
  * Official disciplinary standing (*Dean's Honor Roll, Grade A+*).
  * Telemetry for campus punctuality score, library book returns, and faculty commendation notices.
* **Official Semester Progress Digest (`/parent/marks`)**:
  * Compiles faculty counselor remarks, predicted SGPA, and subject scorecards into a **Downloadable Official Progress Transcript (PDF)**.
* **Interactive Action Alerts (`/parent/notifications`)**:
  * High-priority institutional notification feed with direct action buttons (e.g. submit leave exemption directly from an attendance alert).

---

## 💻 Tech Stack & Engineering Architecture

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Frontend Core** | Next.js 16.2 (App Router), React 19, TypeScript | Server and client components with high-speed Turbopack compilation |
| **Styling & Design System** | Tailwind CSS, Lucide Icons, Custom Design Tokens | Clean institutional aesthetic, responsive mobile grids, no AI slop |
| **Motion & UX** | Framer Motion, Sonner Toaster, Web Haptics API | Micro-animations, page transitions, and tactile feedback |
| **Document Generation** | `jspdf`, `jspdf-autotable` | Client-side compilation of tamper-proof institutional PDF certificates |
| **Backend & Auth** | Supabase, PostgreSQL, Row Level Security (RLS) | Role-Based Access Control (`ADMIN`, `TEACHER`, `STUDENT`, `PARENT`) |
| **Security & Middleware** | Next.js Proxy Middleware (`proxy.ts`), WebAuthn API | Hardware biometric passkey binding, CSP, and route guard protection |
| **Mobile Experience** | Progressive Web App (PWA), Web App Manifest | Native mobile installability, service worker offline caching |

---

## 📄 Complete Route Map (38 Production Routes)

```
Attendex App Router
├── / (Landing Page & Portal Gateway)
├── /login, /signup, /forgot-password (Authentication & Password Reset)
├── /privacy, /terms (Institutional Compliance Documents)
│
├── 🏛️ Faculty & Admin
│   ├── /dashboard (Institutional Command Hub & Defaulter SMS)
│   ├── /pulse (Real-time Live Attendance Telemetry)
│   ├── /attendance (Touch Roll-Call Marking & ROPE Sync)
│   ├── /students (Student Directory & Registry)
│   ├── /classes (Department & Section Management)
│   ├── /subjects (Curriculum Registry & Lock-in)
│   ├── /results/manage (CIA Marks Entry)
│   ├── /results (Results & Transcript Ledger)
│   ├── /timetable (Timetable Grid & CSV Importer)
│   ├── /promotion (End-of-Year Batch Promotion)
│   ├── /audit (Immutable Security Audit Logs)
│   ├── /leaderboard (Merit & Academic XP Rankings)
│   ├── /sports (Extracurricular & Sports Merits)
│   ├── /notifications (Institutional Broadcast Center)
│   └── /settings (Branding, Logo & Passkey Security)
│
├── 🎓 Student Portal
│   ├── /student/dashboard (Student Telemetry Hub)
│   ├── /student/marks (Continuous Assessment & Marksheet PDF)
│   ├── /student/history (Biometric Session Audit & PDF Log)
│   ├── /student/timetable (Daily Class & Lab Schedule)
│   ├── /student/curriculum (Unit Syllabus & PYQ Question Papers)
│   ├── /student/assignments (Coursework & Lab Manual Submissions)
│   ├── /student/calculator (75% Attendance Margin & Skip Simulator)
│   ├── /student/placement (Campus Drive Readiness & Mock Tests)
│   ├── /student/gatepass (Cryptographic Digital Outpass Pass)
│   ├── /student/hall-ticket (University Examination Admit Pass)
│   └── /student/profile (Personal Identity & ID Reissue)
│
└── 👨‍👩‍👧 Guardian / Parent Portal
    ├── /parent/dashboard (Ward Academic Standing & Proctor Card)
    ├── /parent/marks (Progress Digest & Counselor Transcript)
    ├── /parent/history (Daily Lecture Telemetry & Statement)
    ├── /parent/timetable (Child's Class Schedule)
    ├── /parent/leave (Official Medical Exemption & Leave Desk)
    ├── /parent/calendar (Academic Calendar, Exams & iCal Sync)
    ├── /parent/fees (Fee Ledger & Official Tax Receipt PDF)
    ├── /parent/proctor (Faculty Advisor Hub & Callback Booking)
    ├── /parent/conduct (Behavioral Ledger & Dean's Merits)
    └── /parent/notifications (Actionable Family Notifications)
```

---

## ⚡ Quick Start & Development Setup

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/Brandex/Attendly.git
cd Attendly
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Launch the Development Server
```bash
npm run dev -- -p 3001
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

### 4. Production Build & Verification
```bash
npm run build
npm run start
```

---

## 🛡️ Security, Privacy & Integrity

* **Role-Based Guard Rails**: Enforced at the middleware level (`proxy.ts`), preventing unauthorized access or cross-portal leakage between students, parents, and faculty.
* **Tamper-Resistant Marksheets**: Generated client-side using mathematical normalization against verified institutional schemas.
* **Offline Conflict Resolution**: The ROPE service buffers offline roll calls with server timestamp reconciliation to prevent race conditions during reconnections.

---

## 🏢 License & Enterprise Registry

© 2026 **Attendex Systems Private Limited (Brandex)**. All rights reserved.  
Engineered for institutional scale, zero-latency classroom operations, and high-concurrency educational networks.
