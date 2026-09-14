import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/server-state";
import { computePasswordHash } from "@/lib/server-auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").toLowerCase().trim();
    const classId = searchParams.get("class_id");
    const section = searchParams.get("section");
    const page = parseInt(searchParams.get("page") || "0", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);

    let students = serverState.getStudents();

    if (search) {
      students = students.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.roll_number.toLowerCase().includes(search) ||
        s.register_number.toLowerCase().includes(search) ||
        s.email.toLowerCase().includes(search)
      );
    }

    if (classId && classId !== "all") {
      students = students.filter(s => s.class_name.includes(classId) || s.section === classId);
    }

    if (section && section !== "all") {
      students = students.filter(s => s.section === section);
    }

    const total = students.length;
    const paginated = students.slice(page * pageSize, (page + 1) * pageSize);

    return NextResponse.json({
      success: true,
      data: paginated,
      total,
      page,
      pageSize
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Bulk or single
    if (Array.isArray(body)) {
      const dbRows: any[] = [];
      for (const item of body) {
        const student = {
          id: item.id || `stud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: item.name,
          roll_number: item.roll || item.roll_number,
          register_number: item.register_number || `REG2024${item.roll || item.roll_number}`,
          email: item.email,
          dob: item.dob || "01012004",
          formatted_dob: item.formatted_dob || "01/01/2004",
          class_name: item.class_name || item.class || "B.Tech Computer Science (CS-A)",
          section: item.section || "CS-A",
          year: item.year || 2,
          semester: item.semester || 4,
          attendance_percentage: item.attendance_percentage || 85.0,
          cgpa: item.cgpa || 8.0,
          total_sessions: 60,
          attended_sessions: Math.round(60 * ((item.attendance_percentage || 85) / 100)),
          phone: item.phone || "+91 98000 00000",
          parent_name: item.parent_name || "Guardian",
          parent_email: item.parent_email || "",
          parent_phone: item.parent_phone || "",
          hostel: item.hostel || "Day Scholar",
          status: "ACTIVE" as const
        };
        serverState.addStudent(student);

        dbRows.push({
          institution_id: "00000000-0000-0000-0000-000000000001",
          roll_number: student.roll_number,
          register_number: student.register_number,
          name: student.name,
          email: student.email,
          dob: student.dob,
          password_hash: computePasswordHash(student.dob),
          attendance_percentage: student.attendance_percentage,
          cgpa: student.cgpa
        });
      }

      // Batch upsert to eliminate N+1 database queries
      if (isSupabaseConfigured && dbRows.length > 0) {
        supabase.from("students").upsert(dbRows, { onConflict: "institution_id,roll_number" }).then();
      }

      serverState.addAuditLog({
        id: `aud-${Date.now()}`,
        action: "BULK_STUDENT_IMPORT",
        entity_type: "students",
        performed_by: "Registrar Office",
        details: `Imported ${body.length} student records into database`,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ success: true, count: body.length });
    }

    const student = {
      id: body.id || `stud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: body.name,
      roll_number: body.roll || body.roll_number,
      register_number: body.register_number || `REG2024${body.roll || body.roll_number}`,
      email: body.email,
      dob: body.dob || "01012004",
      formatted_dob: body.formatted_dob || "01/01/2004",
      class_name: body.class_name || body.class || "B.Tech Computer Science (CS-A)",
      section: body.section || "CS-A",
      year: body.year || 2,
      semester: body.semester || 4,
      attendance_percentage: body.attendance_percentage || 85.0,
      cgpa: body.cgpa || 8.0,
      total_sessions: 60,
      attended_sessions: Math.round(60 * ((body.attendance_percentage || 85) / 100)),
      phone: body.phone || "+91 98000 00000",
      parent_name: body.parent_name || "Guardian",
      parent_email: body.parent_email || "",
      parent_phone: body.parent_phone || "",
      hostel: body.hostel || "Day Scholar",
      status: "ACTIVE" as const
    };

    serverState.addStudent(student);

    serverState.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "STUDENT_ENROLLMENT",
      entity_type: "students",
      entity_id: student.id,
      performed_by: "Administrator",
      details: `Enrolled student ${student.name} (${student.roll_number})`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, data: student });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id && !body.roll_number) {
      return NextResponse.json({ success: false, error: "Student identifier missing" }, { status: 400 });
    }

    serverState.updateStudent(body.id || body.roll_number, body);

    serverState.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "STUDENT_UPDATE",
      entity_type: "students",
      entity_id: body.id || body.roll_number,
      performed_by: "Faculty / Administrator",
      details: `Updated record for ${body.name || body.roll_number}`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, message: "Student record updated" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
    }

    serverState.deleteStudent(id);

    serverState.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "STUDENT_DELETE",
      entity_type: "students",
      entity_id: id,
      performed_by: "Administrator",
      details: `Removed student record ID: ${id}`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, message: "Student record deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
