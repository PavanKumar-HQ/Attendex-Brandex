import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/server-state";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const classes = serverState.getClasses();
    const students = serverState.getStudents();

    // Dynamically update student count
    const enriched = classes.map(c => {
      const count = students.filter(s => s.class_name.includes(c.section) || s.section === c.section).length;
      return {
        ...c,
        student_count: count > 0 ? count : c.student_count || 8
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched
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
    if (!body.name || !body.section) {
      return NextResponse.json({ success: false, error: "Class name and section are required" }, { status: 400 });
    }

    const newClass = {
      id: body.id || `cls-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: body.name,
      section: body.section,
      year: Number(body.year) || 1,
      semester: Number(body.semester) || 1,
      department: body.department || "CSE",
      academic_year: body.academic_year || "2026-2027",
      student_count: 0,
      claims: []
    };

    serverState.addClass(newClass);

    serverState.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "CLASS_CREATION",
      entity_type: "classes",
      entity_id: newClass.id,
      performed_by: "Administrator",
      details: `Created class ${newClass.name} [${newClass.section}]`,
      timestamp: new Date().toISOString()
    });

    // Sync to Supabase if configured
    if (isSupabaseConfigured) {
      supabase.from("classes").insert({
        id: "40000000-0000-0000-0000-" + newClass.id.padEnd(12, "0").substr(0, 12),
        institution_id: "00000000-0000-0000-0000-000000000001",
        name: newClass.name,
        section: newClass.section,
        year: newClass.year,
        semester: newClass.semester,
        academic_year: newClass.academic_year
      }).then();
    }

    return NextResponse.json({ success: true, data: newClass });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
