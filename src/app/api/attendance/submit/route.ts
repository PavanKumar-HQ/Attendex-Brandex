import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { randomUUID } from "node:crypto";

const submitAttendanceSchema = z.object({
  classId: z.string().min(1),
  subjectId: z.string().min(1),
  date: z.string().min(1),
  period: z.number().int().min(1).max(8).default(1),
  lectureType: z.string().default("Theory"),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(["present", "absent", "od", "ml"]),
      period: z.number().int().optional()
    })
  )
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = submitAttendanceSchema.parse(body);

    const sessionId = randomUUID();
    const institutionId = "00000000-0000-0000-0000-000000000001";
    const teacherId = "00000000-0000-0000-0000-000000000003";

    // 1. Insert Session into PostgreSQL
    const { data: session, error: sessionErr } = await supabase
      .from("attendance_sessions")
      .insert({
        id: sessionId,
        institution_id: institutionId,
        class_id: validated.classId,
        subject_id: validated.subjectId,
        teacher_id: teacherId,
        date: validated.date,
        period: validated.period,
        lecture_type: validated.lectureType,
        total_students: validated.records.length,
        present_count: validated.records.filter(r => r.status === "present").length,
        absent_count: validated.records.filter(r => r.status === "absent").length,
        od_count: validated.records.filter(r => r.status === "od" || r.status === "ml").length,
        status: "LOCKED"
      })
      .select()
      .single();

    // 2. Insert Attendance Records
    const attendanceRecords = validated.records.map(r => ({
      id: randomUUID(),
      session_id: sessionId,
      student_id: r.studentId,
      status: r.status.toUpperCase(),
      period: r.period || validated.period
    }));

    await supabase.from("attendance_records").insert(attendanceRecords);

    // 3. Immutable Audit Trail
    await supabase.from("audit_logs").insert({
      institution_id: institutionId,
      actor_id: teacherId,
      action: "ATTENDANCE_LOGGED",
      entity_type: "attendance_sessions",
      entity_id: sessionId,
      metadata: {
        date: validated.date,
        period: validated.period,
        total_records: validated.records.length,
        absentees: validated.records.filter(r => r.status === "absent").length
      }
    });

    return NextResponse.json({
      success: true,
      message: `Attendance logged for ${validated.records.length} students across period ${validated.period}.`,
      sessionId,
      session
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to log attendance session." },
      { status: 400 }
    );
  }
}
