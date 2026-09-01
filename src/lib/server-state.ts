/**
 * Shared In-Memory Server State for Leave & Gatepasses
 * Backed by Supabase PostgreSQL
 */

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

const globalForServerState = globalThis as unknown as {
  attendexLeaves?: ServerLeave[];
  attendexGatepasses?: ServerGatepass[];
};

if (!globalForServerState.attendexLeaves) {
  globalForServerState.attendexLeaves = [];
}

if (!globalForServerState.attendexGatepasses) {
  globalForServerState.attendexGatepasses = [];
}

export const serverState = {
  getLeaves(): ServerLeave[] {
    return globalForServerState.attendexLeaves!;
  },
  addLeave(leave: ServerLeave) {
    globalForServerState.attendexLeaves = [
      leave,
      ...globalForServerState.attendexLeaves!.filter(l => l.id !== leave.id)
    ];
  },
  updateLeave(id: string, updates: Partial<ServerLeave>) {
    globalForServerState.attendexLeaves = globalForServerState.attendexLeaves!.map(l => {
      if (l.id === id) {
        return { ...l, ...updates };
      }
      return l;
    });
  },
  getGatepasses(): ServerGatepass[] {
    return globalForServerState.attendexGatepasses!;
  },
  addGatepass(gatepass: ServerGatepass) {
    globalForServerState.attendexGatepasses = [
      gatepass,
      ...globalForServerState.attendexGatepasses!.filter(g => g.id !== gatepass.id)
    ];
  },
  updateGatepass(id: string, updates: Partial<ServerGatepass>) {
    globalForServerState.attendexGatepasses = globalForServerState.attendexGatepasses!.map(g => {
      if (g.id === id) {
        return { ...g, ...updates };
      }
      return g;
    });
  }
};
