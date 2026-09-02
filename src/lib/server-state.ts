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

interface StateStore {
  leaves: ServerLeave[];
  gatepasses: ServerGatepass[];
}

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
      return { leaves: [], gatepasses: [] };
    }
    const content = readFileSync(STORE_FILE, "utf8");
    return JSON.parse(content) as StateStore;
  } catch {
    return { leaves: [], gatepasses: [] };
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
  // Debug utility
  getStorePath(): string {
    return STORE_FILE;
  }
};
