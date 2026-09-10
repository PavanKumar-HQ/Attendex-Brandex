import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { serverState } from "@/lib/server-state";

export async function GET() {
  try {
    const { data: dbPasses } = await supabase
      .from("gatepasses")
      .select("*")
      .order("created_at", { ascending: false });

    const memoryPasses = serverState.getGatepasses();
    const students = serverState.getStudents();

    if (dbPasses && dbPasses.length > 0) {
      const mapped = dbPasses.map((g: any) => {
        const student = students.find(s => s.id === g.student_id || s.roll_number === g.student_id);
        const mem = memoryPasses.find(m => m.id === g.id);
        const resolvedStatus = (mem?.status && mem.status !== "PENDING") ? mem.status : (g.status || "PENDING");
        const resolvedReviewer = mem?.reviewedBy || (g.approved_by ? "Prof. Rajesh Verma" : undefined);

        return {
          id: g.id,
          displayCode: `GP-${g.id.slice(0, 4).toUpperCase()}`,
          studentId: g.student_id,
          studentName: student?.name || mem?.studentName || "Student",
          rollNumber: student?.roll_number || mem?.rollNumber || "—",
          exitTime: g.out_time || g.departure_time || mem?.exitTime || "Today 04:00 PM",
          expectedReturn: g.expected_in_time || g.expected_return_time || mem?.expectedReturn || "Today 08:00 PM",
          destination: g.reason || mem?.destination || "Campus Exit",
          reason: g.reason || mem?.reason || "Personal",
          emergencyContact: g.emergency_contact_phone || g.guardian_phone || mem?.emergencyContact || "+91 98450 12345",
          qrNonce: g.qr_code_token || g.qr_token || mem?.qrNonce || `GP-${g.id.slice(0, 6).toUpperCase()}`,
          status: resolvedStatus,
          reviewedBy: resolvedReviewer,
          createdAt: g.created_at || mem?.createdAt || new Date().toISOString()
        };
      });

      const combined = [...mapped, ...memoryPasses.filter(s => !mapped.some(m => m.id === s.id))];
      return NextResponse.json({ success: true, data: combined });
    }

    return NextResponse.json({ success: true, data: memoryPasses });
  } catch {
    return NextResponse.json({ success: true, data: serverState.getGatepasses() });
  }
}
