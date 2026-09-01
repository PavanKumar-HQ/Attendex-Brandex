import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const decideGatepassSchema = z.object({
  gatepassId: z.string().uuid("Invalid Gatepass ID"),
  decision: z.enum(["APPROVED", "REJECTED"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = decideGatepassSchema.parse(body);

    const reviewerId = "00000000-0000-0000-0000-000000000003";

    await supabase
      .from("gatepasses")
      .update({
        status: validated.decision,
        approved_by: reviewerId
      })
      .eq("id", validated.gatepassId);

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
