import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { randomUUID } from "node:crypto";

const submitMarksSchema = z.object({
  classId: z.string().min(1),
  subjectId: z.string().min(1),
  assessmentName: z.string().min(1),
  maxMarks: z.number().min(1).default(40),
  weightage: z.number().min(1).default(20),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      marksObtained: z.number().min(0)
    })
  )
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = submitMarksSchema.parse(body);

    const componentId = randomUUID();
    const institutionId = "00000000-0000-0000-0000-000000000001";
    const teacherId = "00000000-0000-0000-0000-000000000003";

    // 1. Create Assessment Component in PostgreSQL
    const { data: component } = await supabase
      .from("assessment_components")
      .insert({
        id: componentId,
        institution_id: institutionId,
        class_id: validated.classId,
        subject_id: validated.subjectId,
        name: validated.assessmentName,
        type: "CIA",
        max_marks: validated.maxMarks,
        weightage: validated.weightage,
        semester: 4,
        academic_year: "2026-2027"
      })
      .select()
      .single();

    // 2. Insert Marks Rows
    const markRows = validated.records.map(r => ({
      id: randomUUID(),
      assessment_component_id: componentId,
      student_id: r.studentId,
      marks_obtained: r.marksObtained,
      normalized_marks: Math.round((r.marksObtained / validated.maxMarks) * validated.weightage * 10) / 10
    }));

    await supabase.from("marks").insert(markRows);

    // 3. Audit Log
    await supabase.from("audit_logs").insert({
      institution_id: institutionId,
      actor_id: teacherId,
      action: "MARKS_ENTERED",
      entity_type: "assessment_components",
      entity_id: componentId,
      metadata: {
        assessment: validated.assessmentName,
        students_scored: validated.records.length
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully published ${validated.assessmentName} scores for ${validated.records.length} students.`,
      componentId,
      component
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to record marks." },
      { status: 400 }
    );
  }
}
