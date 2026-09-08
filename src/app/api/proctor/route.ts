import { NextResponse } from "next/server";
import { serverState } from "@/lib/server-state";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0"
};

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
          status: m.status || "PENDING",
          scheduledDate: m.meeting_date,
          meetingNotes: m.notes,
          actionItems: m.action_items,
          createdAt: m.created_at || new Date().toISOString()
        }));

        const combined = [...fileRequests, ...mapped.filter((m: any) => !fileRequests.some(f => f.id === m.id))];
        return NextResponse.json({ success: true, data: combined }, { headers: noCacheHeaders });
      }
    } catch {
      // Use file state
    }

    return NextResponse.json({ success: true, data: fileRequests }, { headers: noCacheHeaders });
  } catch {
    return NextResponse.json({ success: true, data: serverState.getProctorRequests() }, { headers: noCacheHeaders });
  }
}
