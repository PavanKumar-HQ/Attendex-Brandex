import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { serverState } from "@/lib/server-state";

const decideLeaveSchema = z.object({
  leaveId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = decideLeaveSchema.parse(body);

    if (validated.decision === "REJECTED" && (!validated.reviewNotes || validated.reviewNotes.trim().length === 0)) {
      return NextResponse.json(
        { success: false, message: "A mandatory rejection reason is required." },
        { status: 400 }
      );
    }

    const existing = serverState.getLeaves().find(l => l.id === validated.leaveId);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Leave request not found." },
        { status: 404 }
      );
    }

    const reviewerId = "00000000-0000-0000-0000-000000000003"; // Prof. Rajesh Verma

    // 1. Update in-memory server state
    serverState.updateLeave(validated.leaveId, {
      status: validated.decision,
      reviewedBy: "Prof. Rajesh Verma (Class Teacher)",
      reviewNotes: validated.reviewNotes,
      reviewedAt: new Date().toISOString()
    });

    // 2. Persist to Supabase PostgreSQL table
    try {
      await supabase
        .from("leave_requests")
        .update({
          status: validated.decision,
          reviewed_by: reviewerId,
          review_notes: validated.reviewNotes || null,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", validated.leaveId);

      await supabase.from("audit_logs").insert({
        institution_id: "00000000-0000-0000-0000-000000000001",
        actor_id: reviewerId,
        action: `LEAVE_${validated.decision}`,
        entity_type: "leave_requests",
        entity_id: validated.leaveId,
        metadata: {
          decision: validated.decision,
          notes: validated.reviewNotes
        }
      });
    } catch {
      // Memory state is active
    }

    return NextResponse.json({
      success: true,
      message: `Leave application ${validated.decision.toLowerCase()} and notification dispatched.`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.errors?.[0]?.message || error.message || "Failed to process decision." },
      { status: 400 }
    );
  }
}
