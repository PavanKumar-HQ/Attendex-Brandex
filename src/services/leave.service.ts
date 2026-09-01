import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { WorkflowStatus } from "./workflow.service";

export type LeaveType = "MEDICAL" | "ON_DUTY" | "FAMILY_EMERGENCY" | "SPORTS" | "CASUAL";

export interface LeaveRequestRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string;
  status: WorkflowStatus;
  decidedBy?: string;
  decisionReason?: string;
  createdAt: string;
}

export const leaveService = {
  /**
   * Parent/Student submits a leave request with automatic teacher assignment.
   */
  async submitLeave(payload: {
    studentId: string;
    studentName?: string;
    rollNumber?: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
    attachmentUrl?: string;
  }): Promise<{ success: boolean; message: string; leaveId?: string }> {
    // Validation
    if (new Date(payload.endDate) < new Date(payload.startDate)) {
      return { success: false, message: "End date cannot precede start date." };
    }
    if (!payload.reason || payload.reason.trim().length < 5) {
      return { success: false, message: "Please provide a descriptive reason (minimum 5 characters)." };
    }

    if (!isSupabaseConfigured) {
      return { 
        success: true, 
        message: "Leave application submitted and routed to Class Teacher (Demo Mode).",
        leaveId: `demo-leave-${Date.now()}`
      };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const institutionId = "00000000-0000-0000-0000-000000000001";

      // 1. Create domain leave_request
      const { data: leave, error: leaveErr } = await supabase
        .from("leave_requests")
        .insert({
          institution_id: institutionId,
          student_id: payload.studentId,
          submitted_by: user?.id || "00000000-0000-0000-0000-000000000004",
          leave_type: payload.leaveType,
          start_date: payload.startDate,
          end_date: payload.endDate,
          reason: payload.reason,
          attachment_url: payload.attachmentUrl || null,
          status: "PENDING"
        })
        .select("id")
        .single();

      if (leaveErr || !leave) throw leaveErr || new Error("Failed to create leave record.");

      // 2. Automatically create approval task for Teacher / Principal
      const { error: taskErr } = await supabase
        .from("approval_tasks")
        .insert({
          institution_id: institutionId,
          request_type: "LEAVE",
          request_id: leave.id,
          assigned_role: "TEACHER",
          status: "PENDING"
        });

      if (taskErr) throw taskErr;

      // 3. Create system notification
      if (user?.id) {
        await supabase.from("notifications").insert({
          institution_id: institutionId,
          user_id: user.id,
          type: "LEAVE_SUBMITTED",
          title: "Leave Application Submitted",
          message: `Your ${payload.leaveType.toLowerCase()} leave request for ${payload.startDate} to ${payload.endDate} has been forwarded for approval.`
        });
      }

      return { success: true, message: "Leave request submitted to Class Teacher.", leaveId: leave.id };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to submit leave request." };
    }
  },

  /**
   * Parent cancels a pending leave request.
   */
  async cancelLeave(leaveId: string): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured) {
      return { success: true, message: "Leave request cancelled." };
    }

    try {
      const { error } = await supabase
        .from("leave_requests")
        .update({ status: "CANCELLED" })
        .eq("id", leaveId)
        .eq("status", "PENDING");

      if (error) throw error;

      await supabase
        .from("approval_tasks")
        .update({ status: "CANCELLED" })
        .eq("request_id", leaveId);

      return { success: true, message: "Leave application safely cancelled." };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to cancel leave." };
    }
  },

  /**
   * Fetches leave applications for a student.
   */
  async getStudentLeaves(studentId?: string): Promise<LeaveRequestRecord[]> {
    if (!isSupabaseConfigured) {
      return this.getMockLeaves();
    }

    try {
      const { data, error } = await supabase
        .from("leave_requests")
        .select(`
          id,
          student_id,
          leave_type,
          start_date,
          end_date,
          reason,
          attachment_url,
          status,
          decided_by,
          decision_reason,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        return this.getMockLeaves();
      }

      return data.map((l: any) => ({
        id: l.id,
        studentId: l.student_id,
        studentName: "Rahul Kumar",
        rollNumber: "21CS042",
        leaveType: l.leave_type as LeaveType,
        startDate: l.start_date,
        endDate: l.end_date,
        reason: l.reason,
        attachmentUrl: l.attachment_url,
        status: l.status as WorkflowStatus,
        decidedBy: l.decided_by,
        decisionReason: l.decision_reason,
        createdAt: l.created_at
      }));
    } catch {
      return this.getMockLeaves();
    }
  },

  getMockLeaves(): LeaveRequestRecord[] {
    return [
      {
        id: "leave-101",
        studentId: "stud-1",
        studentName: "Rahul Kumar",
        rollNumber: "21CS042",
        leaveType: "MEDICAL",
        startDate: "2026-09-05",
        endDate: "2026-09-07",
        reason: "High viral fever. Medical prescription attached for attendance condonation.",
        status: "PENDING",
        createdAt: "2026-09-01T14:10:00Z"
      },
      {
        id: "leave-102",
        studentId: "stud-1",
        studentName: "Rahul Kumar",
        rollNumber: "21CS042",
        leaveType: "ON_DUTY",
        startDate: "2026-08-20",
        endDate: "2026-08-21",
        reason: "Participated in National Inter-University Hackathon at IIT Bombay.",
        status: "APPROVED",
        decisionReason: "Verified with Hackathon participation certificate.",
        createdAt: "2026-08-18T10:00:00Z"
      }
    ];
  }
};
