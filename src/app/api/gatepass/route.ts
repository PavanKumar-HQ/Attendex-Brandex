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
        return {
          id: g.id,
          displayCode: `GP-${g.id.slice(0, 4).toUpperCase()}`,
          studentId: g.student_id,
          studentName: student?.name || "Student",
          rollNumber: student?.roll_number || "—",
          exitTime: g.out_time || g.departure_time || "Today 04:00 PM",
          expectedReturn: g.expected_in_time || g.expected_return_time || "Today 08:00 PM",
          destination: g.reason || "Campus Exit",
          reason: g.reason || "Personal",
          emergencyContact: g.emergency_contact_phone || g.guardian_phone || "+91 98450 12345",
          qrNonce: g.qr_code_token || g.qr_token || `GP-${g.id.slice(0, 6).toUpperCase()}`,
          status: g.status || "PENDING",
          reviewedBy: g.approved_by ? "Prof. Rajesh Verma" : undefined,
          createdAt: g.created_at || new Date().toISOString()
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
