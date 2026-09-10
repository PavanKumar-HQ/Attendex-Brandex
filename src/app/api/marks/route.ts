import { NextRequest, NextResponse } from "next/server";
import { serverState, ServerMarksRecord } from "@/lib/server-state";
import { calculateFinalMarks, calculateAttendanceMarks, calculateCIAMarks, calculateTestMarks } from "@/services/marks.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");
    const subjectId = searchParams.get("subject_id");

    const students = serverState.getStudents();
    const classes = serverState.getClasses();
    const matchedClass = classes.find(c => c.id === classId || c.section === classId);
    const targetSection = matchedClass ? matchedClass.section : classId;

    const storedMarks = serverState.getMarks(classId || undefined, subjectId || undefined);

    // Map stored marks or default realistic assessment scores for students in this class
    const targetStudents = classId
      ? students.filter(s => s.section === targetSection || s.class_name.includes(targetSection || "") || s.class_name.includes(classId))
      : students;

    const result = targetStudents.map(s => {
      const existing = storedMarks.find(m => m.student_id === s.id || m.student_id === s.roll_number);
      if (existing) {
        return {
          student_id: s.id,
          roll_number: s.roll_number,
          name: s.name,
          cia1: existing.cia1,
          cia2: existing.cia2,
          test1: existing.test1,
          test2: existing.test2,
          attendancePercentage: s.attendance_percentage,
          final_marks: existing.final_marks,
          grade: existing.grade
        };
      }

      // Default baseline derived from student's cgpa and attendance
      const baseScore = Math.min(20, Math.max(10, Math.round((s.cgpa / 10) * 20)));
      const testScore = Math.min(25, Math.max(12, Math.round((s.cgpa / 10) * 25)));
      const attMark = calculateAttendanceMarks(s.attendance_percentage);
      const ciaTotal = calculateCIAMarks(baseScore - 2, baseScore);
      const testTotal = calculateTestMarks(testScore - 2, testScore);
      const finalM = calculateFinalMarks(attMark, ciaTotal, testTotal);

      return {
        student_id: s.id,
        roll_number: s.roll_number,
        name: s.name,
        cia1: baseScore - 2,
        cia2: baseScore,
        test1: testScore - 2,
        test2: testScore,
        attendancePercentage: s.attendance_percentage,
        final_marks: finalM,
        grade: finalM >= 18 ? "O" : finalM >= 15 ? "A+" : finalM >= 12 ? "A" : "B+"
      };
    });

    return NextResponse.json({
      success: true,
      data: result
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
    const { class_id, subject_id, records } = body;

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ success: false, error: "Marks records array required" }, { status: 400 });
    }

    const marksRecords: ServerMarksRecord[] = records.map((r: any) => {
      const attMark = calculateAttendanceMarks(r.attendancePercentage || 85);
      const ciaTotal = calculateCIAMarks(Number(r.cia1) || 0, Number(r.cia2) || 0);
      const testTotal = calculateTestMarks(Number(r.test1) || 0, Number(r.test2) || 0);
      const finalScore = calculateFinalMarks(attMark, ciaTotal, testTotal);

      return {
        id: `mk-${Date.now()}-${r.student_id}`,
        student_id: r.student_id || r.roll_number,
        subject_id: subject_id || "sub-cs401",
        class_id: class_id || "cls-csa",
        cia1: Number(r.cia1) || 0,
        cia2: Number(r.cia2) || 0,
        test1: Number(r.test1) || 0,
        test2: Number(r.test2) || 0,
        attendance_score: attMark,
        final_marks: finalScore,
        grade: finalScore >= 18 ? "O" : finalScore >= 15 ? "A+" : finalScore >= 12 ? "A" : "B+",
        updated_at: new Date().toISOString()
      };
    });

    serverState.saveMarks(marksRecords);

    serverState.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "MARKS_EVALUATION_LOCK",
      entity_type: "marks",
      performed_by: "Course Faculty",
      details: `Submitted continuous assessment marks for ${marksRecords.length} students (Subject: ${subject_id || "CS401"})`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, count: marksRecords.length, message: "Marks saved successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
