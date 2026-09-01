import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

let serverGatepasses: any[] = [
  {
    id: "d1111111-0000-4000-a000-000000000001",
    displayCode: "GP-9021",
    studentId: "00000000-0000-0000-0000-000000000032",
    studentName: "Priya Patel",
    rollNumber: "21CS002",
    exitTime: "Today 02:30 PM",
    expectedReturn: "Today 06:00 PM",
    destination: "City Diagnostic Center",
    reason: "Emergency medical consultation with parents.",
    emergencyContact: "+91 98450 12345",
    qrNonce: "GP-7X9K2L",
    status: "PENDING",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
];

export async function GET(req: NextRequest) {
  try {
    const { data: dbPasses } = await supabase
      .from("gatepasses")
      .select("*")
      .order("created_at", { ascending: false });

    if (dbPasses && dbPasses.length > 0) {
      const mapped = dbPasses.map((g: any) => ({
        id: g.id,
        displayCode: `GP-${g.id.slice(0, 4).toUpperCase()}`,
        studentId: g.student_id,
        studentName: "Rahul Deshmukh",
        rollNumber: "21CS042",
        exitTime: g.out_time || "Today 04:00 PM",
        expectedReturn: g.expected_in_time || "Today 08:00 PM",
        destination: g.reason || "Campus Exit",
        reason: g.reason || "Personal",
        emergencyContact: g.emergency_contact_phone || "+91 98450 12345",
        qrNonce: g.qr_code_token || `GP-${g.id.slice(0, 6).toUpperCase()}`,
        status: g.status || "PENDING",
        reviewedBy: g.approved_by ? "Prof. Rajesh Verma" : undefined,
        createdAt: g.created_at || new Date().toISOString()
      }));

      const combined = [...mapped, ...serverGatepasses.filter(s => !mapped.some(m => m.id === s.id))];
      return NextResponse.json({ success: true, data: combined });
    }

    return NextResponse.json({ success: true, data: serverGatepasses });
  } catch {
    return NextResponse.json({ success: true, data: serverGatepasses });
  }
}
