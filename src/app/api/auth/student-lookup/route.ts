import { NextRequest, NextResponse } from "next/server";
import { INSTITUTIONAL_STUDENTS } from "@/lib/student-auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim().toLowerCase();

  if (!query) {
    // Return student list summary with safe format guide (no raw credential leakage)
    const directory = INSTITUTIONAL_STUDENTS.map(s => ({
      roll_number: s.roll_number,
      register_number: s.register_number,
      name: s.name,
      class_name: s.class_name,
      dob_hint: "DDMMYYYY format (e.g. DDMMYYYY of your birth date)"
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
    dob_hint: "DDMMYYYY format (Enter your Date of Birth without slashes or spaces)"
  }));

  return NextResponse.json({ success: true, count: matched.length, results: matched });
}
