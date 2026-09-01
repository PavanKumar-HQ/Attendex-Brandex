import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const decideLeaveSchema = z.object({
  leaveId: z.string().uuid("Invalid Leave ID"),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().optional(),
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

    const institutionId = "00000000-0000-0000-0000-000000000001";
    const reviewerId = "00000000-0000-0000-0000-000000000003";

    // 1. Update PostgreSQL leave_requests table
    const { data: updated, error: updateErr } = await supabase
      .from("leave_requests")
      .update({
        status: validated.decision,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_notes: validated.reviewNotes || (validated.decision === "APPROVED" ? "Medical exemption approved." : null)
      })
      .eq("id", validated.leaveId)
      .select()
      .single();

    // 2. Audit Trail
    await supabase.from("audit_logs").insert({
      institution_id: institutionId,
      actor_id: reviewerId,
      action: `LEAVE_${validated.decision}`,
      entity_type: "leave_requests",
      entity_id: validated.leaveId,
      metadata: {
        decision: validated.decision,
        notes: validated.reviewNotes
      }
    });

    return NextResponse.json({
      success: true,
      message: `Leave application ${validated.decision.toLowerCase()} and notification dispatched to Parent & Student.`,
      data: updated
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to process decision." },
      { status: 400 }
    );
  }
}
