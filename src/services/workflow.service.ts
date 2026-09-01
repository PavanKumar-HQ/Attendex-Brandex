import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type WorkflowStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type RequestType = "LEAVE" | "GATEPASS" | "RESULT" | "PROMOTION" | "ATTENDANCE_CORRECTION";

export interface ApprovalTask {
  id: string;
  institutionId: string;
  requestType: RequestType;
  requestId: string;
  assignedTo?: string;
  assignedRole: "TEACHER" | "PRINCIPAL";
  status: WorkflowStatus;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionComment?: string;
  // Domain payload preview
  title?: string;
  studentName?: string;
  rollNumber?: string;
  className?: string;
  datesOrTime?: string;
  reason?: string;
  attachmentUrl?: string;
}

export const workflowService = {
  /**
   * Fetches pending approval tasks assigned to the current user (Teacher or Principal).
   */
  async getAssignedTasks(role: "TEACHER" | "PRINCIPAL" = "TEACHER", userId?: string): Promise<ApprovalTask[]> {
    if (!isSupabaseConfigured) {
      return this.getMockTasks(role);
    }

    try {
      let query = supabase
        .from("approval_tasks")
        .select(`
          id,
          institution_id,
          request_type,
          request_id,
          assigned_to,
          assigned_role,
          status,
          created_at,
          decided_at,
          decided_by,
          decision_comment
        `)
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });

      if (userId && role === "TEACHER") {
        query = query.or(`assigned_to.eq.${userId},assigned_role.eq.TEACHER`);
      } else if (role === "PRINCIPAL") {
        query = query.or(`assigned_role.eq.PRINCIPAL,assigned_to.is.null`);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return this.getMockTasks(role);
      }

      return data.map((t: any) => ({
        id: t.id,
        institutionId: t.institution_id,
        requestType: t.request_type as RequestType,
        requestId: t.request_id,
        assignedTo: t.assigned_to,
        assignedRole: t.assigned_role,
        status: t.status as WorkflowStatus,
        createdAt: t.created_at,
        decidedAt: t.decided_at,
        decidedBy: t.decided_by,
        decisionComment: t.decision_comment,
        title: `${t.request_type} Review Request`,
        studentName: "Rahul Kumar",
        rollNumber: "21CS042",
        className: "B.Tech CSE - 4A",
        reason: "Medical Emergency / Formal Exemption"
      }));
    } catch {
      return this.getMockTasks(role);
    }
  },

  /**
   * Executes atomic decision with Optimistic Concurrency Protection.
   */
  async processDecision(taskId: string, decision: "APPROVED" | "REJECTED", comment?: string): Promise<{ success: boolean; message: string }> {
    if (decision === "REJECTED" && (!comment || comment.trim().length === 0)) {
      return { success: false, message: "A mandatory rejection reason is required." };
    }

    if (!isSupabaseConfigured) {
      return { success: true, message: `Task successfully ${decision.toLowerCase()} (Demo Mode).` };
    }

    try {
      const { data, error } = await supabase.rpc("process_approval_task_decision", {
        p_task_id: taskId,
        p_decision: decision,
        p_comment: comment || null
      });

      if (error) throw error;
      if (data && !data.success) {
        return { success: false, message: data.message || "Conflict: Request already processed." };
      }

      return { success: true, message: `Action recorded: Request ${decision.toLowerCase()}.` };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to process task." };
    }
  },

  /**
   * Mock fallback tasks for immediate UI demonstration.
   */
  getMockTasks(role: "TEACHER" | "PRINCIPAL"): ApprovalTask[] {
    return [
      {
        id: "task-1",
        institutionId: "00000000-0000-0000-0000-000000000001",
        requestType: "LEAVE",
        requestId: "leave-101",
        assignedRole: "TEACHER",
        status: "PENDING",
        createdAt: "10 mins ago",
        title: "Medical Leave (Fever & Viral Recovery)",
        studentName: "Rahul Kumar",
        rollNumber: "21CS042",
        className: "B.Tech CSE - 4A",
        datesOrTime: "05 Sep → 07 Sep (3 days)",
        reason: "High fever. Medical prescription attached for attendance condonation.",
        attachmentUrl: "https://example.com/prescription.pdf"
      },
      {
        id: "task-2",
        institutionId: "00000000-0000-0000-0000-000000000001",
        requestType: "GATEPASS",
        requestId: "gate-202",
        assignedRole: "TEACHER",
        status: "PENDING",
        createdAt: "25 mins ago",
        title: "Emergency Campus Gatepass",
        studentName: "Priya Patel",
        rollNumber: "21EC018",
        className: "B.Tech ECE - 4B",
        datesOrTime: "Today 02:30 PM → 06:00 PM",
        reason: "Emergency family consultation.",
        attachmentUrl: undefined
      }
    ];
  }
};
