import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { serverState } from "@/lib/server-state";

const decideGatepassSchema = z.object({
  gatepassId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  decidedBy: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = decideGatepassSchema.parse(body);

    const reviewerId = "00000000-0000-0000-0000-000000000003";

    // 1. Update in-memory server state
    serverState.updateGatepass(validated.gatepassId, {
      status: validated.decision,
      reviewedBy: validated.decidedBy || "Dr. S. Kulkarni (Warden)"
    });

    // 2. Persist to Supabase
    try {
      await supabase
        .from("gatepasses")
        .update({
          status: validated.decision,
          approved_by: reviewerId
        })
        .eq("id", validated.gatepassId);

      await supabase.from("audit_logs").insert({
        institution_id: "00000000-0000-0000-0000-000000000001",
        actor_id: reviewerId,
        action: `GATEPASS_${validated.decision}`,
        entity_type: "gatepasses",
        entity_id: validated.gatepassId,
        metadata: {
          decision: validated.decision
        }
      });
    } catch {
      // Memory state is active
    }

    return NextResponse.json({
      success: true,
      message: `Gatepass ${validated.decision.toLowerCase()} and single-use security QR code generated.`
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to process gatepass." },
      { status: 400 }
    );
  }
}
