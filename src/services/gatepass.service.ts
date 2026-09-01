import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { WorkflowStatus } from "./workflow.service";

export interface GatepassRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  exitTime: string;
  expectedReturn: string;
  destination: string;
  reason: string;
  emergencyContact: string;
  qrNonce?: string;
  status: WorkflowStatus;
  approvedBy?: string;
  createdAt: string;
}

export const gatepassService = {
  /**
   * Student submits a gatepass application.
   */
  async submitGatepass(payload: {
    studentId: string;
    exitTime: string;
    expectedReturn: string;
    destination: string;
    reason: string;
    emergencyContact: string;
  }): Promise<{ success: boolean; message: string; gatepassId?: string }> {
    if (!payload.destination || !payload.reason) {
      return { success: false, message: "Please provide both destination and purpose." };
    }

    if (!isSupabaseConfigured) {
      return { 
        success: true, 
        message: "Gatepass request submitted to Class Teacher & Warden (Demo Mode).",
        gatepassId: `gp-demo-${Date.now()}`
      };
    }

    try {
      const institutionId = "00000000-0000-0000-0000-000000000001";
      const qrNonce = `GP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      const { data: gp, error: gpErr } = await supabase
        .from("gatepass_requests")
        .insert({
          institution_id: institutionId,
          student_id: payload.studentId,
          exit_time: payload.exitTime,
          expected_return: payload.expectedReturn,
          destination: payload.destination,
          reason: payload.reason,
          emergency_contact: payload.emergencyContact,
          qr_nonce: qrNonce,
          status: "PENDING"
        })
        .select("id")
        .single();

      if (gpErr || !gp) throw gpErr || new Error("Failed to create gatepass record.");

      // Create workflow task
      await supabase.from("approval_tasks").insert({
        institution_id: institutionId,
        request_type: "GATEPASS",
        request_id: gp.id,
        assigned_role: "TEACHER",
        status: "PENDING"
      });

      return { success: true, message: "Gatepass application dispatched for review.", gatepassId: gp.id };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to submit gatepass." };
    }
  },

  async getStudentGatepasses(studentId?: string): Promise<GatepassRecord[]> {
    if (!isSupabaseConfigured) {
      return this.getMockGatepasses();
    }

    try {
      const { data, error } = await supabase
        .from("gatepass_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        return this.getMockGatepasses();
      }

      return data.map((gp: any) => ({
        id: gp.id,
        studentId: gp.student_id,
        studentName: "Rahul Kumar",
        rollNumber: "21CS042",
        exitTime: gp.exit_time,
        expectedReturn: gp.expected_return,
        destination: gp.destination,
        reason: gp.reason,
        emergencyContact: gp.emergency_contact,
        qrNonce: gp.qr_nonce,
        status: gp.status as WorkflowStatus,
        approvedBy: gp.approved_by,
        createdAt: gp.created_at
      }));
    } catch {
      return this.getMockGatepasses();
    }
  },

  getMockGatepasses(): GatepassRecord[] {
    return [
      {
        id: "gp-101",
        studentId: "stud-1",
        studentName: "Rahul Kumar",
        rollNumber: "21CS042",
        exitTime: "Today 02:30 PM",
        expectedReturn: "Today 06:00 PM",
        destination: "Apollo City Clinic & Diagnostics",
        reason: "Medical health checkup and doctor consultation.",
        emergencyContact: "+91 98450 12345 (Father)",
        qrNonce: "GP-7X9K2L",
        status: "PENDING",
        createdAt: "2026-09-01T14:20:00Z"
      }
    ];
  }
};
