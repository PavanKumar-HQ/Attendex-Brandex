import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

let serverLeaves: any[] = [
  {
    id: "c1111111-0000-4000-a000-000000000001",
    displayCode: "LV-8091",
    studentId: "00000000-0000-0000-0000-000000000030",
    studentName: "Rahul Deshmukh",
    rollNumber: "21CS042",
    className: "B.Tech CSE - 4A",
    leaveType: "MEDICAL",
    startDate: "2026-09-05",
    endDate: "2026-09-07",
    reason: "Severe viral fever with clinical doctor prescription.",
    status: "PENDING",
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  }
];

export async function GET(req: NextRequest) {
  try {
    // Attempt Supabase PostgreSQL query first
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

      // Combine with server memory
      const combined = [...mapped, ...serverLeaves.filter(s => !mapped.some(m => m.id === s.id))];
      return NextResponse.json({ success: true, data: combined });
    }

    return NextResponse.json({ success: true, data: serverLeaves });
  } catch {
    return NextResponse.json({ success: true, data: serverLeaves });
  }
}
