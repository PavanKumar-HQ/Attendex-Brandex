import { NextRequest, NextResponse } from "next/server";
import { authenticateStudentCredentials } from "@/lib/student-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "Register Number and Date of Birth (DOB) are required." },
        { status: 400 }
      );
    }

    const authResult = await authenticateStudentCredentials(identifier, password);

    if (!authResult.success || !authResult.student) {
      return NextResponse.json(
        { success: false, message: authResult.message },
        { status: 401 }
      );
    }

    const student = authResult.student;
    const response = NextResponse.json({
      success: true,
      role: "STUDENT",
      student,
      message: authResult.message
    });

    // Set authoritative session cookies
    response.cookies.set("attendex_demo_session", "STUDENT", {
      path: "/",
      maxAge: 86400 * 7,
      sameSite: "lax",
      httpOnly: false
    });

    response.cookies.set("attendex_student_roll", student.roll_number, {
      path: "/",
      maxAge: 86400 * 7,
      sameSite: "lax",
      httpOnly: false
    });

    response.cookies.set("attendex_student_name", encodeURIComponent(student.name), {
      path: "/",
      maxAge: 86400 * 7,
      sameSite: "lax",
      httpOnly: false
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error during student authentication." },
      { status: 500 }
    );
  }
}
