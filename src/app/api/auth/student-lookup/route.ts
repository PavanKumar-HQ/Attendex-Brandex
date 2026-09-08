import { NextRequest, NextResponse } from "next/server";
import { INSTITUTIONAL_STUDENTS } from "@/lib/student-auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim().toLowerCase();

  if (!query) {
    // Return student list summary with masked DOB hints for credential recovery
    const directory = INSTITUTIONAL_STUDENTS.map(s => ({
      roll_number: s.roll_number,
      register_number: s.register_number,
      name: s.name,
      class_name: s.class_name,
      dob_hint: `${s.formatted_dob.substring(0, 6)}**** (DDMMYYYY format)`
    }));
    return NextResponse.json({ success: true, count: directory.length, directory });
  }

  const matched = INSTITUTIONAL_STUDENTS.filter(s => 
    s.roll_number.toLowerCase().includes(query) ||
    s.name.toLowerCase().includes(query) ||
    s.register_number.toLowerCase().includes(query)
  ).map(s => ({
    roll_number: s.roll_number,
    register_number: s.register_number,
    name: s.name,
    class_name: s.class_name,
    dob_hint: s.formatted_dob,
    password_format: `Enter ${s.dob} (DDMMYYYY)`
  }));

  return NextResponse.json({ success: true, count: matched.length, results: matched });
}
