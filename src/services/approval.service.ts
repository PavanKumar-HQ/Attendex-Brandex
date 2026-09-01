import { supabase } from "@/lib/supabase";
import { ApprovalRequest, ApprovalStatus, ApprovalType } from "@/types";

export const approvalService = {
  /**
   * Fetches real approval requests for the institution (Principal View).
   */
  async getApprovalRequests(status?: ApprovalStatus): Promise<ApprovalRequest[]> {
    try {
      let query = supabase
        .from("approval_tasks")
        .select(`
          id,
          institution_id,
          request_type,
          request_id,
          assigned_role,
          status,
          created_at,
          decision_comment,
          user_profiles:assigned_to (
            full_name,
            role
          )
        `)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error || !data) {
        return [];
      }

      return data.map((req: any) => ({
        id: req.id,
        institutionId: req.institution_id,
        type: req.request_type as ApprovalType,
        title: `${req.request_type.replace("_", " ")} Review Request`,
        requesterName: req.user_profiles?.full_name || "Faculty Member",
        requesterRole: req.user_profiles?.role || "TEACHER",
        department: "Computer Science",
        details: {},
        status: req.status as ApprovalStatus,
        createdAt: req.created_at,
        rejectionReason: req.decision_comment
      }));
    } catch {
      return [];
    }
  },

  /**
   * Principal approves a pending request.
   */
  async approveRequest(id: string, comments?: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc("process_approval_task_decision", {
        p_task_id: id,
        p_decision: "APPROVED",
        p_comment: comments || null
      });

      if (error) throw error;
      return { success: true, message: "Request approved and audit ledger updated." };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to approve request." };
    }
  },

  /**
   * Principal rejects a pending request.
   */
  async rejectRequest(id: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc("process_approval_task_decision", {
        p_task_id: id,
        p_decision: "REJECTED",
        p_comment: reason
      });

      if (error) throw error;
      return { success: true, message: "Request rejected and notifications dispatched." };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to reject request." };
    }
  }
};
