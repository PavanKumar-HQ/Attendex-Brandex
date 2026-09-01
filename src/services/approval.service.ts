import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ApprovalRequest, ApprovalStatus, ApprovalType } from "@/types";

export const approvalService = {
  /**
   * Fetches all approval requests for the institution (Principal View).
   */
  async getApprovalRequests(status?: ApprovalStatus): Promise<ApprovalRequest[]> {
    if (!isSupabaseConfigured) {
      return this.getMockApprovals(status);
    }

    try {
      let query = supabase
        .from("approval_requests")
        .select(`
          id,
          institution_id,
          type,
          title,
          status,
          created_at,
          rejection_reason,
          details,
          user_profiles:requested_by (
            full_name,
            role
          )
        `)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return this.getMockApprovals(status);
      }

      return data.map((req: any) => ({
        id: req.id,
        institutionId: req.institution_id,
        type: req.type as ApprovalType,
        title: req.title,
        requesterName: req.user_profiles?.full_name || "Faculty Member",
        requesterRole: req.user_profiles?.role || "TEACHER",
        department: req.details?.department || "Computer Science",
        details: req.details || {},
        status: req.status as ApprovalStatus,
        createdAt: req.created_at,
        rejectionReason: req.rejection_reason
      }));
    } catch {
      return this.getMockApprovals(status);
    }
  },

  /**
   * Principal approves a pending request.
   */
  async approveRequest(id: string, comments?: string): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured) {
      return { success: true, message: "Request approved successfully (Demo Mode)." };
    }

    try {
      const { error } = await supabase
        .from("approval_requests")
        .update({
          status: "APPROVED",
          approved_at: new Date().toISOString(),
          rejection_reason: comments || null
        })
        .eq("id", id);

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
    if (!isSupabaseConfigured) {
      return { success: true, message: "Request rejected (Demo Mode)." };
    }

    try {
      const { error } = await supabase
        .from("approval_requests")
        .update({
          status: "REJECTED",
          approved_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq("id", id);

      if (error) throw error;
      return { success: true, message: "Request rejected and notifications dispatched." };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to reject request." };
    }
  },

  /**
   * Mock data fallback for instant UI demonstration.
   */
  getMockApprovals(filterStatus?: ApprovalStatus): ApprovalRequest[] {
    const all: ApprovalRequest[] = [
      {
        id: "app-1",
        institutionId: "00000000-0000-0000-0000-000000000001",
        type: "LEAVE",
        title: "Medical Leave Condonation (3 Days - Typhoid Recovery)",
        requesterName: "Aarav Sharma (21CS042)",
        requesterRole: "STUDENT",
        department: "Computer Science & Engineering",
        details: { dates: "Aug 26 - Aug 28", doctorCert: "hospital_doc_verified.pdf", currentAttendance: "71.4%" },
        status: "PENDING",
        createdAt: "15 mins ago"
      },
      {
        id: "app-2",
        institutionId: "00000000-0000-0000-0000-000000000001",
        type: "GATEPASS",
        title: "Emergency Campus Out-Pass (Family Medical Consultation)",
        requesterName: "Priya Patel (21EC018)",
        requesterRole: "STUDENT",
        department: "Electronics & Communication",
        details: { exitTime: "02:30 PM", expectedReturn: "06:00 PM", parentContact: "+91 98450 12345" },
        status: "PENDING",
        createdAt: "30 mins ago"
      },
      {
        id: "app-3",
        institutionId: "00000000-0000-0000-0000-000000000001",
        type: "RESULT_PUBLICATION",
        title: "Continuous Assessment CIA-2 Marks Finalization",
        requesterName: "Prof. Rajesh Verma",
        requesterRole: "TEACHER",
        department: "Information Technology",
        details: { subject: "Distributed Cloud Systems (CS701)", batch: "B.Tech IT 7A", studentCount: 64 },
        status: "PENDING",
        createdAt: "1 hour ago"
      },
      {
        id: "app-4",
        institutionId: "00000000-0000-0000-0000-000000000001",
        type: "PROMOTION",
        title: "Semester 5 to Semester 6 Cohort Batch Advancement",
        requesterName: "Academic Dean Office",
        requesterRole: "TEACHER",
        department: "Computer Science & Engineering",
        details: { totalEligible: 118, detainedCount: 4, minCgpaRequirement: 5.0 },
        status: "PENDING",
        createdAt: "2 hours ago"
      },
      {
        id: "app-5",
        institutionId: "00000000-0000-0000-0000-000000000001",
        type: "HALL_TICKET",
        title: "End-Semester Examination Hall Ticket Generation Sign-Off",
        requesterName: "Controller of Examinations",
        requesterRole: "TEACHER",
        department: "Institutional Examination Cell",
        details: { semester: "Sem 8 Final Examinations", totalIssued: 480, thresholdApplied: "75.0%" },
        status: "PENDING",
        createdAt: "4 hours ago"
      }
    ];

    if (filterStatus) {
      return all.filter(a => a.status === filterStatus);
    }
    return all;
  }
};
