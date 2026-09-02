/**
 * ATTENDEX — Persistent File-Based State Store
 * 
 * Replaces globalThis in-memory store. Writes to a JSON file on disk
 * so that all Next.js API route workers (dev & prod) share the same state.
 * Falls back to Supabase PostgreSQL when data is available there.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

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

interface StateStore {
  leaves: ServerLeave[];
  gatepasses: ServerGatepass[];
  proctorRequests: ServerProctorRequest[];
}

const INITIAL_PROCTOR_REQUESTS: ServerProctorRequest[] = [
  {
    id: "p1111111-0000-4000-a000-000000000001",
    displayCode: "PR-8012",
    studentId: "00000000-0000-0000-0000-000000000030",
    studentName: "Rahul Deshmukh",
    rollNumber: "21CS042",
    className: "B.Tech CSE - 4A",
    proctorName: "Dr. Pavan Kulkarni",
    topic: "Semester Review & CIA Feedback",
    message: "Reviewed CIA-1 scores. Rahul is performing consistently in Distributed Systems (94%). Recommended focusing on Applied Physics lab coursework.",
    status: "COMPLETED",
    scheduledDate: "2026-09-20",
    scheduledTime: "04:00 PM",
    meetingNotes: "Student advised to attend weekly problem-solving tutorials.",
    actionItems: "Resolved",
    createdAt: "2026-09-20T10:30:00.000Z"
  },
  {
    id: "p1111111-0000-4000-a000-000000000002",
    displayCode: "PR-8013",
    studentId: "00000000-0000-0000-0000-000000000030",
    studentName: "Rahul Deshmukh",
    rollNumber: "21CS042",
    className: "B.Tech CSE - 4A",
    proctorName: "Dr. Pavan Kulkarni",
    topic: "Proctor Onboarding & Standing",
    message: "Confirmed student enrollment in final year electives and capstone project panel allocation.",
    status: "COMPLETED",
    scheduledDate: "2026-08-12",
    scheduledTime: "03:30 PM",
    meetingNotes: "All prerequisite credit clearances verified.",
    actionItems: "Completed",
    createdAt: "2026-08-12T09:00:00.000Z"
  }
];

// Use a fixed path in the system temp directory so all worker processes share it
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

function readStore(): StateStore {
  try {
    ensureDir();
    if (!existsSync(STORE_FILE)) {
      const initial: StateStore = { leaves: [], gatepasses: [], proctorRequests: INITIAL_PROCTOR_REQUESTS };
      writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const content = readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(content) as StateStore;
    if (!parsed.proctorRequests) {
      parsed.proctorRequests = INITIAL_PROCTOR_REQUESTS;
      writeFileSync(STORE_FILE, JSON.stringify(parsed, null, 2), "utf8");
    }
    return parsed;
  } catch {
    return { leaves: [], gatepasses: [], proctorRequests: INITIAL_PROCTOR_REQUESTS };
  }
}

function writeStore(state: StateStore): void {
  try {
    ensureDir();
    writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // ignore
  }
}

export const serverState = {
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
  // Debug utility
  getStorePath(): string {
    return STORE_FILE;
  }
};
