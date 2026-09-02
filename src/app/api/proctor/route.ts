import { NextResponse } from "next/server";
import { serverState } from "@/lib/server-state";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const fileRequests = serverState.getProctorRequests();

    // Try Supabase proctor_meetings table if populated
    try {
      const { data: dbMeetings } = await supabase
        .from("proctor_meetings")
        .select("*")
        .order("created_at", { ascending: false });

      if (dbMeetings && dbMeetings.length > 0) {
        const mapped = dbMeetings.map((m: any) => ({
          id: m.id,
          displayCode: `PR-${m.id.slice(0, 4).toUpperCase()}`,
          studentId: "00000000-0000-0000-0000-000000000030",
          studentName: "Rahul Deshmukh",
          rollNumber: "21CS042",
          className: "B.Tech CSE - 4A",
          proctorName: "Dr. Pavan Kulkarni",
          topic: m.agenda || "Proctor Consultation",
          message: m.notes || "",
          status: "COMPLETED",
          scheduledDate: m.meeting_date,
          meetingNotes: m.notes,
          actionItems: m.action_items,
          createdAt: m.created_at || new Date().toISOString()
        }));

        const combined = [...mapped, ...fileRequests.filter(f => !mapped.some(m => m.id === f.id))];
        return NextResponse.json({ success: true, data: combined });
      }
    } catch {
      // Use file state
    }

    return NextResponse.json({ success: true, data: fileRequests });
  } catch {
    return NextResponse.json({ success: true, data: serverState.getProctorRequests() });
  }
}
