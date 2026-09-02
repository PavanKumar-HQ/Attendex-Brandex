import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { serverState } from "@/lib/server-state";

export async function GET() {
  try {
    // 1. Load from persistent file state (always available cross-process)
    const fileLeaves = serverState.getLeaves();

    // 2. Try Supabase for persisted records (works once RLS migration is applied)
    let dbLeaves: any[] = [];
    try {
      const { data } = await supabase
        .from("leave_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (data && data.length > 0) {
        dbLeaves = data;
      }
    } catch {
      // DB unavailable — file state is the source of truth
    }

    if (dbLeaves.length > 0) {
      const mapped = dbLeaves.map((l: any) => ({
        id: l.id,
        displayCode: l.display_code || `LV-${l.id.slice(0, 4).toUpperCase()}`,
        studentId: l.student_id,
        studentName: l.student_name || "Student",
        rollNumber: l.roll_number || "—",
        className: l.class_name || "B.Tech CSE - 4A",
        leaveType: l.leave_type || "MEDICAL",
        startDate: l.start_date,
        endDate: l.end_date,
        reason: l.reason,
        status: l.status || "PENDING",
        reviewedBy: l.reviewed_by || undefined,
        reviewNotes: l.review_notes || undefined,
        reviewedAt: l.reviewed_at || undefined,
        createdAt: l.created_at || new Date().toISOString()
      }));

      // Merge: DB records take precedence, file state fills in any not yet persisted
      const combined = [...mapped, ...fileLeaves.filter(f => !mapped.some(m => m.id === f.id))];
      return NextResponse.json({ success: true, data: combined });
    }

    // 3. Return file state entirely
    return NextResponse.json({ success: true, data: fileLeaves });
  } catch {
    return NextResponse.json({ success: true, data: serverState.getLeaves() });
  }
}
