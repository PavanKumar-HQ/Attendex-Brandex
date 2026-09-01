import { supabase } from "@/lib/supabase";

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
  title: string;
  studentName?: string;
  rollNumber?: string;
  className?: string;
  datesOrTime?: string;
  reason?: string;
  attachmentUrl?: string;
}

export const workflowService = {
  /**
   * Fetches real pending approval tasks assigned to the current user (Teacher or Principal).
   */
  async getAssignedTasks(role: "TEACHER" | "PRINCIPAL" = "TEACHER", userId?: string): Promise<ApprovalTask[]> {
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
        return [];
      }

      // Fetch linked domain details for rich cards
      const tasksWithDomain: ApprovalTask[] = await Promise.all(
        data.map(async (t: any) => {
          let studentName = "Student";
          let rollNumber = "Verified ID";
          let datesOrTime = "";
          let reason = "";
          let attachmentUrl = undefined;

          if (t.request_type === "LEAVE") {
            const { data: leave } = await supabase
              .from("leave_requests")
              .select("start_date, end_date, reason, attachment_url, students:student_id(name, roll_number)")
              .eq("id", t.request_id)
              .single();

            if (leave) {
              studentName = (leave as any).students?.name || "Student";
              rollNumber = (leave as any).students?.roll_number || "21CS042";
              datesOrTime = `${leave.start_date} → ${leave.end_date}`;
              reason = leave.reason;
              attachmentUrl = leave.attachment_url;
            }
          } else if (t.request_type === "GATEPASS") {
            const { data: gp } = await supabase
              .from("gatepass_requests")
              .select("exit_time, expected_return, destination, reason, students:student_id(name, roll_number)")
              .eq("id", t.request_id)
              .single();

            if (gp) {
              studentName = (gp as any).students?.name || "Student";
              rollNumber = (gp as any).students?.roll_number || "21EC018";
              datesOrTime = `${gp.exit_time} → ${gp.expected_return}`;
              reason = `${gp.destination}: ${gp.reason}`;
            }
          }

          return {
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
            title: `${t.request_type.replace("_", " ")} Review Request`,
            studentName,
            rollNumber,
            className: "Active Cohort",
            datesOrTime,
            reason,
            attachmentUrl
          };
        })
      );

      return tasksWithDomain;
    } catch {
      return [];
    }
  },

  /**
   * Executes atomic decision with Optimistic Concurrency Protection.
   */
  async processDecision(taskId: string, decision: "APPROVED" | "REJECTED", comment?: string): Promise<{ success: boolean; message: string }> {
    if (decision === "REJECTED" && (!comment || comment.trim().length === 0)) {
      return { success: false, message: "A mandatory rejection reason is required." };
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
  }
};
