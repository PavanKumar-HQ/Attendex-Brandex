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
  globalForServerState.attendexLeaves = [
    {
      id: "c1111111-0000-4000-a000-000000000001",
      displayCode: "LV-8091",
      studentId: "00000000-0000-0000-0000-000000000030",
      studentName: "Rahul Deshmukh",
      rollNumber: "21CS042",
      className: "B.Tech CSE - 4A",
      leaveType: "MEDICAL",
      startDate: "2026-09-05",
      endDate: "2026-09-07",
      reason: "Severe viral fever with clinical doctor prescription.",
      status: "PENDING",
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    }
  ];
}

if (!globalForServerState.attendexGatepasses) {
  globalForServerState.attendexGatepasses = [
    {
      id: "d1111111-0000-4000-a000-000000000001",
      displayCode: "GP-9021",
      studentId: "00000000-0000-0000-0000-000000000032",
      studentName: "Priya Patel",
      rollNumber: "21CS002",
      exitTime: "Today 02:30 PM",
      expectedReturn: "Today 06:00 PM",
      destination: "City Diagnostic Center",
      reason: "Emergency medical consultation with parents.",
      emergencyContact: "+91 98450 12345",
      qrNonce: "GP-7X9K2L",
      status: "PENDING",
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    }
  ];
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
