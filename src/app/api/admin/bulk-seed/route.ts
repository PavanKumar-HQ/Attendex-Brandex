import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { INSTITUTIONAL_STUDENTS } from "@/lib/student-auth";
import { computePasswordHash } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        message: "Supabase PostgreSQL endpoint is not configured in environment."
      }, { status: 503 });
    }

    const results = {
      departments: 0,
      classes: 0,
      students: 0,
      staff: 0,
      errors: [] as string[]
    };

    const instId = "00000000-0000-0000-0000-000000000001";

    // 1. Ensure Root Institution
    await supabase.from("institutions").upsert({
      id: instId,
      name: "Global Institute of Technology & Engineering (GITE)",
      code: "GITE",
      current_academic_year: "2026-2027",
      current_semester: 4,
      min_attendance_threshold: 75.00
    }, { onConflict: "code" });

    // 2. Ensure Departments
    const deptRes = await supabase.from("departments").upsert([
      { id: "10000000-0000-0000-0000-000000000001", institution_id: instId, name: "Computer Science & Engineering", code: "CSE" },
      { id: "10000000-0000-0000-0000-000000000002", institution_id: instId, name: "Electronics & Communication", code: "ECE" }
    ], { onConflict: "institution_id,code" });
    if (!deptRes.error) results.departments += 2;
    else results.errors.push(`Dept error: ${deptRes.error.message}`);

    // 3. Ensure Classes
    const classRes = await supabase.from("classes").upsert([
      {
        id: "40000000-0000-0000-0000-000000000001",
        institution_id: instId,
        department_id: "10000000-0000-0000-0000-000000000001",
        name: "B.Tech Computer Science (CS-A)",
        section: "CS-A",
        year: 2,
        semester: 4,
        academic_year: "2026-2027"
      },
      {
        id: "40000000-0000-0000-0000-000000000002",
        institution_id: instId,
        department_id: "10000000-0000-0000-0000-000000000001",
        name: "B.Tech Computer Science (CS-B)",
        section: "CS-B",
        year: 2,
        semester: 4,
        academic_year: "2026-2027"
      }
    ]);
    if (!classRes.error) results.classes += 2;
    else results.errors.push(`Class error: ${classRes.error.message}`);

    // 4. Ingest All Students with Hashed Passwords
    const studentRows = INSTITUTIONAL_STUDENTS.map(s => ({
      id: s.id.startsWith("cc") ? s.id : undefined,
      institution_id: instId,
      class_id: s.section === "CS-B" ? "40000000-0000-0000-0000-000000000002" : "40000000-0000-0000-0000-000000000001",
      roll_number: s.roll_number,
      register_number: s.register_number,
      name: s.name,
      email: s.email,
      phone: s.phone,
      dob: s.dob,
      formatted_dob: s.formatted_dob,
      password_hash: computePasswordHash(s.dob),
      salt: "attendex_sec_salt_2026",
      attendance_percentage: s.attendance_percentage,
      cgpa: s.cgpa,
      total_sessions: s.total_sessions,
      attended_sessions: s.attended_sessions,
      parent_name: s.parent_name,
      parent_email: s.parent_email,
      parent_phone: s.parent_phone,
      hostel: s.hostel,
      status: s.status
    }));

    const studentRes = await supabase.from("students").upsert(studentRows, { onConflict: "institution_id,roll_number" });
    if (!studentRes.error) {
      results.students = studentRows.length;
    } else {
      results.errors.push(`Students insert error: ${studentRes.error.message}`);
    }

    // 5. Ingest Staff Profiles
    const staffProfiles = [
      {
        id: "aa000000-0000-0000-0000-000000000001",
        institution_id: instId,
        role: "ADMIN",
        email: "admin@attendex.institution.edu",
        full_name: "Dr. Ramesh Sundaram (Dean)",
        phone: "+91 98765 00001",
        password_hash: computePasswordHash("admin123"),
        status: "ACTIVE"
      },
      {
        id: "aa000000-0000-0000-0000-000000000002",
        institution_id: instId,
        role: "TEACHER",
        email: "faculty.cs@attendex.institution.edu",
        full_name: "Prof. Arvind Sharma",
        phone: "+91 98765 00002",
        password_hash: computePasswordHash("faculty123"),
        status: "ACTIVE"
      },
      {
        id: "aa000000-0000-0000-0000-000000000003",
        institution_id: instId,
        role: "PRINCIPAL",
        email: "principal@attendex.edu",
        full_name: "Dr. K. S. Prabhakar (Principal)",
        phone: "+91 98765 00005",
        password_hash: computePasswordHash("admin123"),
        status: "ACTIVE"
      }
    ];

    const staffRes = await supabase.from("user_profiles").upsert(staffProfiles, { onConflict: "institution_id,email" });
    if (!staffRes.error) results.staff = staffProfiles.length;
    else results.errors.push(`Staff insert error: ${staffRes.error.message}`);

    return NextResponse.json({
      success: true,
      message: `Bulk seed finished: ${results.students} students, ${results.staff} staff ingested with hashed passwords.`,
      details: results
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: err?.message || "Internal error during bulk seed."
    }, { status: 500 });
  }
}
