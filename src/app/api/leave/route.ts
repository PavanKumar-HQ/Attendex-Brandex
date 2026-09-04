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
      const mapped = dbLeaves.map((l: any) => {
        const fileMatch = fileLeaves.find(f => f.id === l.id);
        return {
          id: l.id,
          displayCode: l.display_code || fileMatch?.displayCode || `LV-${l.id.slice(0, 4).toUpperCase()}`,
          studentId: l.student_id,
          studentName: l.student_name || fileMatch?.studentName || "Student",
          rollNumber: l.roll_number || fileMatch?.rollNumber || "—",
          className: l.class_name || fileMatch?.className || "B.Tech CSE - 4A",
          leaveType: l.leave_type || fileMatch?.leaveType || "MEDICAL",
          startDate: l.start_date || fileMatch?.startDate,
          endDate: l.end_date || fileMatch?.endDate,
          reason: l.reason || fileMatch?.reason,
          status: fileMatch?.status || l.status || "PENDING",
          reviewedBy: fileMatch?.reviewedBy || l.reviewed_by || undefined,
          reviewNotes: fileMatch?.reviewNotes || l.review_notes || undefined,
          reviewedAt: fileMatch?.reviewedAt || l.reviewed_at || undefined,
          createdAt: l.created_at || fileMatch?.createdAt || new Date().toISOString()
        };
      });

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
