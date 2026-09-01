import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { serverState } from "@/lib/server-state";

export async function GET(req: NextRequest) {
  try {
    const { data: dbLeaves } = await supabase
      .from("leave_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (dbLeaves && dbLeaves.length > 0) {
      const mapped = dbLeaves.map((l: any) => ({
        id: l.id,
        displayCode: `LV-${l.id.slice(0, 4).toUpperCase()}`,
        studentId: l.student_id,
        studentName: "Rahul Deshmukh",
        rollNumber: "21CS042",
        className: "B.Tech CSE - 4A",
        leaveType: l.leave_type || "MEDICAL",
        startDate: l.start_date,
        endDate: l.end_date,
        reason: l.reason,
        status: l.status || "PENDING",
        reviewedBy: l.reviewed_by ? "Prof. Rajesh Verma" : undefined,
        reviewNotes: l.review_notes || undefined,
        reviewedAt: l.reviewed_at || undefined,
        createdAt: l.created_at || new Date().toISOString()
      }));

      const serverMemory = serverState.getLeaves();
      const combined = [...mapped, ...serverMemory.filter(s => !mapped.some(m => m.id === s.id))];
      return NextResponse.json({ success: true, data: combined });
    }

    return NextResponse.json({ success: true, data: serverState.getLeaves() });
  } catch {
    return NextResponse.json({ success: true, data: serverState.getLeaves() });
  }
}
