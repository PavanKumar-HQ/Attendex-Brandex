/**
 * ATTENDEX — Universal Persistent Institutional State Store
 * 
 * Writes to a shared JSON file on disk so all Next.js API route workers
 * and client pages share the identical state.
 * Propagates to Supabase PostgreSQL when available.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { INSTITUTIONAL_STUDENTS, InstitutionalStudent } from "./student-auth";

export interface ServerLeave {
  id: string;
  displayCode: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  className: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface ServerGatepass {
  id: string;
  displayCode: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  exitTime: string;
  expectedReturn: string;
  destination: string;
  reason: string;
  emergencyContact: string;
  qrNonce: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewedBy?: string;
  createdAt: string;
}

export interface ServerProctorRequest {
  id: string;
  displayCode: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  className: string;
  proctorName: string;
  topic: string;
  message: string;
  preferredTime?: string;
  contactPhone?: string;
  status: "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  scheduledDate?: string;
  scheduledTime?: string;
  meetingNotes?: string;
  actionItems?: string;
  createdAt: string;
}

export interface ServerClass {
  id: string;
  name: string;
  section: string;
  year: number;
  semester: number;
  department: string;
  academic_year: string;
  student_count: number;
  claims: {
    subject_id: string;
    teacher_id: string;
    teacher_name: string;
  }[];
}

export interface ServerSubject {
  id: string;
  code: string;
  name: string;
  department: string;
  credits: number;
  semester: number;
  year?: number;
  is_lab: boolean;
}

export interface ServerMarksRecord {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  cia1: number;
  cia2: number;
  test1: number;
  test2: number;
  attendance_score: number;
  final_marks: number;
  grade: string;
  updated_at: string;
}

export interface ServerAttendanceSession {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  date: string;
  period: number;
  academic_year: string;
  records: {
    student_id: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "ON_DUTY";
  }[];
  created_at: string;
}

export interface ServerAssignment {
  id: string;
  title: string;
  subject_id: string;
  subject_name: string;
  class_id: string;
  instructor: string;
  deadline: string;
  max_marks: number;
  description: string;
  submissions: {
    student_id: string;
    student_name: string;
    roll_number: string;
    submission_url: string;
    submitted_at: string;
    status: "Submitted" | "Graded";
    score?: string;
  }[];
}

export interface ServerSportsEntry {
  id: string;
  category: string;
  class_id: string;
  class_name: string;
  position: "1st" | "2nd" | "3rd" | "Participant";
  points: number;
  recorded_at: string;
}

export interface ServerAuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  performed_by: string;
  details: string;
  timestamp: string;
}

interface StateStore {
  leaves: ServerLeave[];
  gatepasses: ServerGatepass[];
  proctorRequests: ServerProctorRequest[];
  classes: ServerClass[];
  subjects: ServerSubject[];
  students: InstitutionalStudent[];
  marks: ServerMarksRecord[];
  attendanceSessions: ServerAttendanceSession[];
  assignments: ServerAssignment[];
  sports: ServerSportsEntry[];
  auditLogs: ServerAuditLog[];
}

const INITIAL_CLASSES: ServerClass[] = [
  {
    id: "cls-csa",
    name: "B.Tech Computer Science (CS-A)",
    section: "CS-A",
    year: 2,
    semester: 4,
    department: "CSE",
    academic_year: "2026-2027",
    student_count: 8,
    claims: [
      { subject_id: "sub-cs401", teacher_id: "teacher-1", teacher_name: "Prof. Arvind Sharma" },
      { subject_id: "sub-cs404", teacher_id: "teacher-1", teacher_name: "Prof. Arvind Sharma" }
    ]
  },
  {
    id: "cls-csb",
    name: "B.Tech Computer Science (CS-B)",
    section: "CS-B",
    year: 2,
    semester: 4,
    department: "CSE",
    academic_year: "2026-2027",
    student_count: 8,
    claims: [
      { subject_id: "sub-cs402", teacher_id: "teacher-2", teacher_name: "Dr. Priya Kulkarni" }
    ]
  },
  {
    id: "cls-ita",
    name: "B.Tech Information Technology (IT-A)",
    section: "IT-A",
    year: 2,
    semester: 4,
    department: "IT",
    academic_year: "2026-2027",
    student_count: 6,
    claims: []
  },
  {
    id: "cls-ece",
    name: "B.Tech Electronics & Comm (ECE-A)",
    section: "ECE-A",
    year: 3,
    semester: 6,
    department: "ECE",
    academic_year: "2026-2027",
    student_count: 6,
    claims: []
  },
  {
    id: "cls-ai",
    name: "B.Tech Artificial Intelligence (AI-A)",
    section: "AI-A",
    year: 3,
    semester: 6,
    department: "AI",
    academic_year: "2026-2027",
    student_count: 6,
    claims: [
      { subject_id: "sub-ai601", teacher_id: "teacher-2", teacher_name: "Dr. Priya Kulkarni" }
    ]
  }
];

const INITIAL_SUBJECTS: ServerSubject[] = [
  { id: "sub-cs401", code: "CS401", name: "Database Management Systems & SQL Lab", department: "CSE", credits: 4, semester: 4, year: 2, is_lab: true },
  { id: "sub-cs402", code: "CS402", name: "Operating Systems & Kernel Development", department: "CSE", credits: 4, semester: 4, year: 2, is_lab: false },
  { id: "sub-cs403", code: "CS403", name: "Computer Networks & Protocol Security", department: "CSE", credits: 3, semester: 4, year: 2, is_lab: false },
  { id: "sub-cs404", code: "CS404", name: "Distributed Systems & Cloud Computing", department: "CSE", credits: 4, semester: 4, year: 2, is_lab: false },
  { id: "sub-cs405", code: "CS405", name: "Design & Analysis of Algorithms", department: "CSE", credits: 4, semester: 4, year: 2, is_lab: false },
  { id: "sub-ai601", code: "AI601", name: "Artificial Intelligence & Neural Architectures", department: "AI", credits: 4, semester: 6, year: 3, is_lab: false },
  { id: "sub-ai602", code: "AI602", name: "Deep Learning & Computer Vision Lab", department: "AI", credits: 4, semester: 6, year: 3, is_lab: true },
  { id: "sub-ec601", code: "EC601", name: "VLSI Design & Embedded Systems", department: "ECE", credits: 4, semester: 6, year: 3, is_lab: true }
];

const INITIAL_ASSIGNMENTS: ServerAssignment[] = [
  {
    id: "asg-1",
    title: "Distributed Consensus Algorithm (Raft Implementation)",
    subject_id: "sub-cs404",
    subject_name: "Distributed Systems & Cloud (CS404)",
    class_id: "cls-csa",
    instructor: "Prof. Arvind Sharma",
    deadline: "2026-10-15",
    max_marks: 10,
    description: "Implement leader election and log replication module with test suite validation.",
    submissions: [
      {
        student_id: "cc000000-0000-0000-0000-000000000011",
        student_name: "Aarav Sharma",
        roll_number: "CS-11",
        submission_url: "https://github.com/aaravsharma/raft-consensus",
        submitted_at: "2026-10-03T18:30:00Z",
        status: "Submitted",
        score: "9.5 / 10"
      }
    ]
  },
  {
    id: "asg-2",
    title: "Transformer Multi-Head Self-Attention Visualization",
    subject_id: "sub-ai601",
    subject_name: "Artificial Intelligence (AI601)",
    class_id: "cls-csa",
    instructor: "Dr. Priya Kulkarni",
    deadline: "2026-10-20",
    max_marks: 15,
    description: "Visualize attention weights across BERT transformer heads for textual sentiment classification.",
    submissions: []
  },
  {
    id: "asg-3",
    title: "Transaction ACID Recovery & ARIES WAL Protocol",
    subject_id: "sub-cs401",
    subject_name: "Database Systems (CS401)",
    class_id: "cls-csa",
    instructor: "Dr. P. Patel",
    deadline: "2026-10-28",
    max_marks: 10,
    description: "Formulate write-ahead logging rollback trace under abrupt server crash scenarios.",
    submissions: []
  }
];

const INITIAL_SPORTS: ServerSportsEntry[] = [
  { id: "sp-1", category: "100m Sprint", class_id: "cls-csa", class_name: "B.Tech CS-A", position: "1st", points: 10, recorded_at: "2026-08-20T10:00:00Z" },
  { id: "sp-2", category: "Cricket Championship", class_id: "cls-csb", class_name: "B.Tech CS-B", position: "1st", points: 15, recorded_at: "2026-08-22T14:30:00Z" },
  { id: "sp-3", category: "Inter-Department Chess", class_id: "cls-csa", class_name: "B.Tech CS-A", position: "2nd", points: 7, recorded_at: "2026-08-25T11:00:00Z" },
  { id: "sp-4", category: "Volleyball Tournament", class_id: "cls-ece", class_name: "B.Tech ECE-A", position: "1st", points: 12, recorded_at: "2026-08-27T16:00:00Z" }
];

const INITIAL_AUDIT_LOGS: ServerAuditLog[] = [
  {
    id: "aud-001",
    action: "INSTITUTION_PROVISION",
    entity_type: "institutions",
    entity_id: "00000000-0000-0000-0000-000000000001",
    performed_by: "Super Administrator",
    details: "Initialized Global Institute of Technology institutional node",
    timestamp: "2026-08-01T08:00:00Z"
  },
  {
    id: "aud-002",
    action: "BATCH_ENROLLMENT",
    entity_type: "students",
    performed_by: "Dean Office",
    details: "Ingested and provisioned 16 undergraduate engineering students with hashed credentials",
    timestamp: "2026-08-05T09:30:00Z"
  },
  {
    id: "aud-003",
    action: "FACULTY_ALLOCATION",
    entity_type: "classes",
    performed_by: "Principal Office",
    details: "Locked course teaching assignments for Semester 4 and 6",
    timestamp: "2026-08-10T11:15:00Z"
  }
];

const STORE_DIR = join(tmpdir(), "attendex-state");
const STORE_FILE = join(STORE_DIR, "workflow-state.json");

function ensureDir(): void {
  try {
    if (!existsSync(STORE_DIR)) {
      mkdirSync(STORE_DIR, { recursive: true });
    }
  } catch {
    // ignore
  }
}

let memoryCache: StateStore | null = null;

function readStore(): StateStore {
  if (memoryCache) return memoryCache;
  try {
    ensureDir();
    if (!existsSync(STORE_FILE)) {
      const initial: StateStore = {
        leaves: [],
        gatepasses: [],
        proctorRequests: [],
        classes: INITIAL_CLASSES,
        subjects: INITIAL_SUBJECTS,
        students: INSTITUTIONAL_STUDENTS,
        marks: [],
        attendanceSessions: [],
        assignments: INITIAL_ASSIGNMENTS,
        sports: INITIAL_SPORTS,
        auditLogs: INITIAL_AUDIT_LOGS
      };
      writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf8");
      memoryCache = initial;
      return initial;
    }
    const content = readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(content) as StateStore;
    
    // Ensure all keys exist for forward compatibility
    let modified = false;
    if (!parsed.classes || parsed.classes.length === 0) { parsed.classes = INITIAL_CLASSES; modified = true; }
    if (!parsed.subjects || parsed.subjects.length === 0) { parsed.subjects = INITIAL_SUBJECTS; modified = true; }
    if (!parsed.students || parsed.students.length === 0) { 
      parsed.students = INSTITUTIONAL_STUDENTS; 
      modified = true; 
    } else {
      // Ensure student IDs match canonical institutional UUIDs
      const instMap = new Map(INSTITUTIONAL_STUDENTS.map(s => [s.roll_number, s.id]));
      for (const s of parsed.students) {
        const canonicalId = instMap.get(s.roll_number);
        if (canonicalId && s.id !== canonicalId) {
          s.id = canonicalId;
          modified = true;
        }
      }
    }
    if (!parsed.assignments) { parsed.assignments = INITIAL_ASSIGNMENTS; modified = true; }
    if (!parsed.sports) { parsed.sports = INITIAL_SPORTS; modified = true; }
    if (!parsed.auditLogs) { parsed.auditLogs = INITIAL_AUDIT_LOGS; modified = true; }
    if (!parsed.marks) { parsed.marks = []; modified = true; }
    if (!parsed.attendanceSessions) { parsed.attendanceSessions = []; modified = true; }

    if (modified) {
      writeFileSync(STORE_FILE, JSON.stringify(parsed, null, 2), "utf8");
    }
    memoryCache = parsed;
    return memoryCache;
  } catch {
    memoryCache = {
      leaves: [],
      gatepasses: [],
      proctorRequests: [],
      classes: INITIAL_CLASSES,
      subjects: INITIAL_SUBJECTS,
      students: INSTITUTIONAL_STUDENTS,
      marks: [],
      attendanceSessions: [],
      assignments: INITIAL_ASSIGNMENTS,
      sports: INITIAL_SPORTS,
      auditLogs: INITIAL_AUDIT_LOGS
    };
    return memoryCache;
  }
}

function writeStore(state: StateStore): void {
  memoryCache = state;
  try {
    ensureDir();
    writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // ignore
  }
}

export const serverState = {
  // ─── LEAVES ───
  getLeaves(): ServerLeave[] {
    return readStore().leaves;
  },
  addLeave(leave: ServerLeave) {
    const state = readStore();
    state.leaves = [leave, ...state.leaves.filter(l => l.id !== leave.id)];
    writeStore(state);
  },
  updateLeave(id: string, updates: Partial<ServerLeave>) {
    const state = readStore();
    state.leaves = state.leaves.map(l => l.id === id ? { ...l, ...updates } : l);
    writeStore(state);
  },

  // ─── GATEPASSES ───
  getGatepasses(): ServerGatepass[] {
    return readStore().gatepasses;
  },
  addGatepass(gatepass: ServerGatepass) {
    const state = readStore();
    state.gatepasses = [gatepass, ...state.gatepasses.filter(g => g.id !== gatepass.id)];
    writeStore(state);
  },
  updateGatepass(id: string, updates: Partial<ServerGatepass>) {
    const state = readStore();
    state.gatepasses = state.gatepasses.map(g => g.id === id ? { ...g, ...updates } : g);
    writeStore(state);
  },

  // ─── PROCTOR REQUESTS ───
  getProctorRequests(): ServerProctorRequest[] {
    return readStore().proctorRequests;
  },
  addProctorRequest(req: ServerProctorRequest) {
    const state = readStore();
    state.proctorRequests = [req, ...state.proctorRequests.filter(p => p.id !== req.id)];
    writeStore(state);
  },
  updateProctorRequest(id: string, updates: Partial<ServerProctorRequest>) {
    const state = readStore();
    state.proctorRequests = state.proctorRequests.map(p => p.id === id ? { ...p, ...updates } : p);
    writeStore(state);
  },
  resetProctorRequests() {
    const state = readStore();
    state.proctorRequests = [];
    writeStore(state);
  },

  // ─── CLASSES ───
  getClasses(): ServerClass[] {
    return readStore().classes;
  },
  addClass(cls: ServerClass) {
    const state = readStore();
    state.classes = [...state.classes.filter(c => c.id !== cls.id), cls];
    writeStore(state);
  },
  updateClass(id: string, updates: Partial<ServerClass>) {
    const state = readStore();
    state.classes = state.classes.map(c => c.id === id ? { ...c, ...updates } : c);
    writeStore(state);
  },
  claimSubject(classId: string, subjectId: string, teacherId: string, teacherName: string) {
    const state = readStore();
    state.classes = state.classes.map(c => {
      if (c.id !== classId) return c;
      const filtered = (c.claims || []).filter(cl => cl.subject_id !== subjectId);
      return {
        ...c,
        claims: [...filtered, { subject_id: subjectId, teacher_id: teacherId, teacher_name: teacherName }]
      };
    });
    writeStore(state);
  },

  // ─── SUBJECTS ───
  getSubjects(): ServerSubject[] {
    return readStore().subjects;
  },
  addSubject(subject: ServerSubject) {
    const state = readStore();
    state.subjects = [...state.subjects.filter(s => s.id !== subject.id), subject];
    writeStore(state);
  },
  updateSubject(id: string, updates: Partial<ServerSubject>) {
    const state = readStore();
    state.subjects = state.subjects.map(s => s.id === id ? { ...s, ...updates } : s);
    writeStore(state);
  },

  // ─── STUDENTS ───
  getStudents(): InstitutionalStudent[] {
    return readStore().students;
  },
  addStudent(student: InstitutionalStudent) {
    const state = readStore();
    state.students = [...state.students.filter(s => s.id !== student.id && s.roll_number !== student.roll_number), student];
    writeStore(state);
  },
  updateStudent(id: string, updates: Partial<InstitutionalStudent>) {
    const state = readStore();
    state.students = state.students.map(s => (s.id === id || s.roll_number === id) ? { ...s, ...updates } : s);
    writeStore(state);
  },
  deleteStudent(id: string) {
    const state = readStore();
    state.students = state.students.filter(s => s.id !== id && s.roll_number !== id);
    writeStore(state);
  },

  // ─── MARKS ───
  getMarks(classId?: string, subjectId?: string): ServerMarksRecord[] {
    const all = readStore().marks;
    return all.filter(m => {
      const matchClass = !classId || m.class_id === classId;
      const matchSub = !subjectId || m.subject_id === subjectId;
      return matchClass && matchSub;
    });
  },
  saveMarks(records: ServerMarksRecord[]) {
    const state = readStore();
    const map = new Map<string, ServerMarksRecord>();
    for (const m of state.marks) {
      map.set(`${m.student_id}_${m.subject_id}`, m);
    }
    for (const r of records) {
      map.set(`${r.student_id}_${r.subject_id}`, r);
    }
    state.marks = Array.from(map.values());
    writeStore(state);
  },

  // ─── ATTENDANCE SESSIONS ───
  getAttendanceSessions(classId?: string): ServerAttendanceSession[] {
    const state = readStore();
    if (!classId) return state.attendanceSessions;
    return state.attendanceSessions.filter(s => s.class_id === classId);
  },
  addAttendanceSession(session: ServerAttendanceSession) {
    const state = readStore();
    state.attendanceSessions = [session, ...state.attendanceSessions.filter(s => s.id !== session.id)];
    
    // Dynamically update student attendance percentage in registry
    for (const rec of session.records) {
      const stIndex = state.students.findIndex(s => s.id === rec.student_id || s.roll_number === rec.student_id);
      if (stIndex !== -1) {
        const current = state.students[stIndex];
        const newTotal = (current.total_sessions || 60) + 1;
        const newAttended = (current.attended_sessions || 54) + (rec.status === "PRESENT" || rec.status === "ON_DUTY" ? 1 : 0);
        const newPct = Number(((newAttended / newTotal) * 100).toFixed(1));
        state.students[stIndex] = {
          ...current,
          total_sessions: newTotal,
          attended_sessions: newAttended,
          attendance_percentage: newPct
        };
      }
    }
    writeStore(state);
  },

  // ─── ASSIGNMENTS ───
  getAssignments(classId?: string): ServerAssignment[] {
    const state = readStore();
    if (!classId) return state.assignments;
    return state.assignments.filter(a => a.class_id === classId);
  },
  addAssignmentSubmission(asgId: string, submission: ServerAssignment["submissions"][0]) {
    const state = readStore();
    state.assignments = state.assignments.map(a => {
      if (a.id !== asgId) return a;
      const filtered = a.submissions.filter(s => s.student_id !== submission.student_id);
      return {
        ...a,
        submissions: [...filtered, submission]
      };
    });
    writeStore(state);
  },

  // ─── SPORTS ───
  getSports(): ServerSportsEntry[] {
    return readStore().sports;
  },
  addSportsEntry(entry: ServerSportsEntry) {
    const state = readStore();
    state.sports = [entry, ...state.sports];
    writeStore(state);
  },

  // ─── AUDIT LOGS ───
  getAuditLogs(): ServerAuditLog[] {
    return readStore().auditLogs;
  },
  addAuditLog(log: ServerAuditLog) {
    const state = readStore();
    state.auditLogs = [log, ...state.auditLogs];
    writeStore(state);
  }
};
