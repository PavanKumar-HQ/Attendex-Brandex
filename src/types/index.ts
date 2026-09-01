/**
 * Attendex — Shared Type Definitions
 * Central type system. No more `any` scattered across components.
 */

// ─── Enums ───────────────────────────────────────────────────
export type Role = "SUPER_ADMIN" | "PRINCIPAL" | "TEACHER" | "STUDENT" | "PARENT" | "ADMIN";
export type ApprovalType = "LEAVE" | "GATEPASS" | "RESULT_PUBLICATION" | "PROMOTION" | "HALL_TICKET" | "ACADEMIC_CHANGE";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "ON_DUTY" | "LATE";
export type NotificationChannel = "SMS" | "WHATSAPP" | "EMAIL" | "PUSH";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "QUEUED";
export type InsightLevel = "good" | "warning" | "risk";

// ─── Approval Request ─────────────────────────────────────────
export interface ApprovalRequest {
  id: string;
  institutionId: string;
  type: ApprovalType;
  title: string;
  requesterName: string;
  requesterRole: string;
  department: string;
  details?: Record<string, any>;
  status: ApprovalStatus;
  createdAt: string;
  rejectionReason?: string;
}

// ─── Organization / Institution (Multi-Tenant) ────────────────
export interface Organization {
  id: string;
  name: string;
  code: string; // e.g. "GITE"
  logo?: string;
  principalName?: string;
  studentCount?: number;
  facultyCount?: number;
  status?: "ACTIVE" | "SUSPENDED" | "PROVISIONING";
  createdAt: Date;
}

// ─── User / Auth ─────────────────────────────────────────────
export interface SessionUser {
  id: string;
  name: string;
  role: Role;
  organizationId: string;
  email?: string;
}

// ─── Student ─────────────────────────────────────────────────
export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email?: string;
  phone?: string;
  batch?: string;
  classId: string;
  className?: string;
  organizationId: string;
  attendancePercentage?: number;
}

export interface StudentWithMarks extends Student {
  marks: StudentMarksInput;
}

// ─── Marks ───────────────────────────────────────────────────
export interface StudentMarksInput {
  attendancePercentage: number;
  cia1?: number;
  cia2?: number;
  test1?: number; // raw out of 40
  test2?: number; // raw out of 40
  assignment?: number;
}

export interface PerformanceResult {
  attendanceMarks: number;  // out of 5
  ciaTotal: number;         // out of 5
  testScore: number;        // out of 10
  finalMarks: number;       // out of 20
  totalClasses: number;
  presentCount: number;
}

export interface ParentInsight {
  status: InsightLevel;
  insight: string;
  alert: string | null;
}

// ─── Attendance ──────────────────────────────────────────────
export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
}

export interface AttendancePayload {
  classId: string;
  date: string; // ISO date
  lectureNumber: number;
  entries: AttendanceEntry[];
  markedBy: string; // teacher ID
  organizationId: string;
}

export interface AttendanceRecord {
  id: string;
  date: Date;
  lectureNumber: number;
  status: AttendanceStatus;
  studentId: string;
  studentName?: string;
  studentRoll?: string;
  classId: string;
}

// ─── Class ───────────────────────────────────────────────────
export interface ClassInfo {
  id: string;
  name: string;
  studentCount: number;
  organizationId: string;
}

// ─── Notification ────────────────────────────────────────────
export interface NotificationPayload {
  studentId: string;
  parentPhone?: string;
  message: string;
  channel: NotificationChannel;
  organizationId: string;
}

// ─── Report ──────────────────────────────────────────────────
export interface ReportRequest {
  type: "DEFAULTER_LIST" | "MONTHLY_SHEET" | "DEPARTMENT_OVERVIEW";
  classId?: string;
  dateRange?: { from: string; to: string };
  organizationId: string;
}

// ─── API Response ────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Sidebar ─────────────────────────────────────────────────
export interface SidebarLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}


