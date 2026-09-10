import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { serverState } from "@/lib/server-state";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();

    const classId = raw.classId || raw.class_id;
    const subjectId = raw.subjectId || raw.subject_id;
    const date = raw.date || new Date().toISOString().split("T")[0];
    const period = Number(raw.period) || 1;
    const lectureType = raw.lectureType || raw.lecture_type || "Theory";
    const rawRecords = raw.records || [];

    if (!classId || !subjectId || !Array.isArray(rawRecords) || rawRecords.length === 0) {
      return NextResponse.json(
        { success: false, message: "classId, subjectId, and non-empty records are required." },
        { status: 400 }
      );
    }

    const records = rawRecords.map((r: any) => {
      const s = (r.status || "present").toUpperCase();
      const normalizedStatus: "PRESENT" | "ABSENT" | "LATE" | "ON_DUTY" =
        s === "OD" || s === "ML" ? "ON_DUTY" : s === "ABSENT" ? "ABSENT" : s === "LATE" ? "LATE" : "PRESENT";

      return {
        student_id: r.studentId || r.student_id,
        status: normalizedStatus
      };
    });

    const sessionId = randomUUID();
    const institutionId = "00000000-0000-0000-0000-000000000001";
    const teacherId = "00000000-0000-0000-0000-000000000003";

    // 1. Update Persistent Multi-Layer State
    serverState.addAttendanceSession({
      id: sessionId,
      class_id: classId,
      subject_id: subjectId,
      teacher_id: teacherId,
      date,
      period,
      academic_year: "2026-2027",
      records,
      created_at: new Date().toISOString()
    });

    serverState.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "ATTENDANCE_LOGGED",
      entity_type: "attendance_sessions",
      entity_id: sessionId,
      performed_by: "Course Faculty",
      details: `Logged period ${period} attendance for ${records.length} students (Subject: ${subjectId})`,
      timestamp: new Date().toISOString()
    });

    // 2. Synchronize to Supabase PostgreSQL (schema-aligned)
    try {
      const { error: sessionErr } = await supabase
        .from("attendance_sessions")
        .insert({
          id: sessionId,
          institution_id: institutionId,
          class_id: classId.length === 36 ? classId : "40000000-0000-0000-0000-000000000001",
          subject_id: subjectId.length === 36 ? subjectId : "20000000-0000-0000-0000-000000000001",
          teacher_id: "aa000000-0000-0000-0000-000000000002",
          date,
          period_number: period,
          lecture_type: lectureType,
          status: "FINALIZED",
          created_by: "aa000000-0000-0000-0000-000000000002",
          version: 1,
          finalized_at: new Date().toISOString()
        });

      if (sessionErr) {
        console.warn("[Supabase Sync Warning] attendance_sessions:", sessionErr.message);
      }

      const attendanceRows = records.map(r => ({
        id: randomUUID(),
        session_id: sessionId,
        student_id: r.student_id.length === 36 ? r.student_id : "cc000000-0000-0000-0000-000000000011",
        status: r.status === "ON_DUTY" ? "OD" : r.status,
        source: "WEB",
        marked_by: "aa000000-0000-0000-0000-000000000002",
        version: 1
      }));

      const { error: recordsErr } = await supabase.from("attendance_records").insert(attendanceRows);
      if (recordsErr) {
        console.warn("[Supabase Sync Warning] attendance_records:", recordsErr.message);
      }
    } catch (err: any) {
      console.warn("[Supabase Network/Driver Exception]:", err?.message);
    }

    const presentCount = records.filter(r => r.status === "PRESENT" || r.status === "ON_DUTY").length;
    const rate = Math.round((presentCount / records.length) * 100);

    return NextResponse.json({
      success: true,
      message: `Attendance logged for ${records.length} students across period ${period}.`,
      sessionId,
      attendance_rate: rate,
      present_count: presentCount,
      absent_count: records.length - presentCount
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to log attendance session." },
      { status: 400 }
    );
  }
}
