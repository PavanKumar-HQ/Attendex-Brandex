import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/server-state";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { class_id, subject_id, teacher_id, teacher_name } = body;

    if (!class_id || !subject_id) {
      return NextResponse.json({ success: false, error: "Class ID and Subject ID are required" }, { status: 400 });
    }

    serverState.claimSubject(
      class_id,
      subject_id,
      teacher_id || "faculty-current",
      teacher_name || "Faculty Member"
    );

    serverState.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "SUBJECT_ALLOCATION_CLAIM",
      entity_type: "classes",
      entity_id: class_id,
      performed_by: teacher_name || "Faculty Member",
      details: `Claimed subject ${subject_id} for class ${class_id}`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, message: "Course teaching allocation locked successfully." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
