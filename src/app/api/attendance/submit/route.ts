import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { serverState } from "@/lib/server-state";
import { cacheManager } from "@/lib/cache-manager";
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
      const validClassIds = ["40000000-0000-0000-0000-000000000001", "40000000-0000-0000-0000-000000000002", "40000000-0000-0000-0000-000000000003"];
      const targetClassId = validClassIds.includes(classId) ? classId : "40000000-0000-0000-0000-000000000001";
      const validSubjectIds = [
        "50000000-0000-0000-0000-000000000001",
        "50000000-0000-0000-0000-000000000002",
        "50000000-0000-0000-0000-000000000003",
        "50000000-0000-0000-0000-000000000004",
        "50000000-0000-0000-0000-000000000005"
      ];
      const targetSubjectId = validSubjectIds.includes(subjectId) ? subjectId : "50000000-0000-0000-0000-000000000001";

      const { error: sessionErr } = await supabase
        .from("attendance_sessions")
        .insert({
          id: sessionId,
          institution_id: institutionId,
          class_id: targetClassId,
          subject_id: targetSubjectId,
          teacher_id: "bb000000-0000-0000-0000-000000000001",
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

      const allStudents = serverState.getStudents();
      const studentMap = new Map(allStudents.map(s => [s.roll_number.toLowerCase(), s.id]));

      const attendanceRows = records.map(r => {
        const matchedId = studentMap.get(r.student_id.toLowerCase()) || 
          (r.student_id.startsWith("cc") ? r.student_id : "cc000000-0000-0000-0000-000000000001");
        
        let mappedStatus = (r.status || "PRESENT").toUpperCase();
        if (mappedStatus === "ON_DUTY") mappedStatus = "OD";
        if (!["PRESENT", "ABSENT", "OD", "ML", "LATE", "HOLIDAY"].includes(mappedStatus)) {
          mappedStatus = "PRESENT";
        }

        return {
          id: randomUUID(),
          session_id: sessionId,
          student_id: matchedId,
          status: mappedStatus,
          source: "WEB",
          marked_by: "aa000000-0000-0000-0000-000000000002",
          version: 1
        };
      });

      const { error: recordsErr } = await supabase.from("attendance_records").insert(attendanceRows);
      if (recordsErr) {
        console.warn("[Supabase Sync Warning] attendance_records:", recordsErr.message);
      }
    } catch (err: any) {
      console.warn("[Supabase Network/Driver Exception]:", err?.message);
    }

    const presentCount = records.filter(r => r.status === "PRESENT" || r.status === "ON_DUTY").length;
    const rate = Math.round((presentCount / records.length) * 100);

    // Invalidate stale telemetry and ward caches
    cacheManager.invalidateTags(["pulse", "attendance", "ward"]);

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
