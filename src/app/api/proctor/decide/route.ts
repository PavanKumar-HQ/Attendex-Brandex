import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { serverState } from "@/lib/server-state";
import { supabase } from "@/lib/supabase";

const decideProctorSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  meetingNotes: z.string().optional(),
  actionItems: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = decideProctorSchema.parse(body);

    const updates = {
      status: validated.action,
      scheduledDate: validated.scheduledDate || new Date().toISOString().split("T")[0],
      scheduledTime: validated.scheduledTime || "04:00 PM",
      meetingNotes: validated.meetingNotes || (validated.action === "SCHEDULED" ? "Meeting slot confirmed." : "Consultation completed and guidance provided."),
      actionItems: validated.actionItems || (validated.action === "COMPLETED" ? "Resolved" : "Scheduled")
    };

    serverState.updateProctorRequest(validated.requestId, updates);

    // Try PostgreSQL audit log
    try {
      await supabase.from("audit_logs").insert({
        institution_id: "00000000-0000-0000-0000-000000000001",
        actor_id: "00000000-0000-0000-0000-000000000003",
        action: `PROCTOR_MEETING_${validated.action}`,
        entity_type: "proctor_meetings",
        entity_id: validated.requestId,
        metadata: {
          action: validated.action,
          notes: validated.meetingNotes
        }
      });
    } catch {
      // Ignore
    }

    return NextResponse.json({
      success: true,
      message: `Proctor consultation marked as ${validated.action.toLowerCase()}.`,
      updates
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.errors?.[0]?.message || error.message || "Failed to update proctor consultation." },
      { status: 400 }
    );
  }
}
