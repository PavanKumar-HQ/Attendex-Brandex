import { NextRequest, NextResponse } from "next/server";
import { serverState, ServerMarksRecord } from "@/lib/server-state";
import { calculateFinalMarks, calculateAttendanceMarks, calculateCIAMarks, calculateTestMarks } from "@/services/marks.service";
import { cacheManager } from "@/lib/cache-manager";
import { DEFAULT_STUDENT, TEST_FIXTURES } from "@/lib/student-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");
    const subjectId = searchParams.get("subject_id");
    const rollNumber = searchParams.get("roll_number");
    const studentId = searchParams.get("student_id");

    const students = serverState.getStudents();
    const subjects = serverState.getSubjects();

    // 1. Single Student Query (for Student Portal & Parent Portal)
    const targetQuery = rollNumber || studentId;
    if (targetQuery) {
      const isRoleKeyword = ["STUDENT", "DEMO", "USER", "DEFAULT", "ALL"].includes(targetQuery.trim().toUpperCase());
      let student = isRoleKeyword
        ? (students.find(s => s.roll_number === "CS-11") || students[0] || DEFAULT_STUDENT)
        : students.find(s => 
            s.roll_number.toLowerCase() === targetQuery.toLowerCase() || 
            s.id === targetQuery ||
            s.register_number.toLowerCase() === targetQuery.toLowerCase()
          );

      if (!student && !isRoleKeyword) {
        student = TEST_FIXTURES.find(s => 
          s.roll_number.toLowerCase() === targetQuery.toLowerCase() || 
          s.id === targetQuery ||
          s.register_number.toLowerCase() === targetQuery.toLowerCase()
        );
      }

      if (!student && isRoleKeyword) {
        student = students[0] || DEFAULT_STUDENT;
      }

      if (!student) {
        return NextResponse.json({ success: false, error: "Student not found" }, { status: 404 });
      }

      // Return marks for all subjects enrolled by this student
      const storedMarks = serverState.getMarks(undefined, undefined);
      const studentMarks = storedMarks.filter(m => m.student_id === student.id || m.student_id === student.roll_number);

      const enrolledSubjects = subjects.filter(sub => sub.department === "CSE" || !sub.department);

      const data = enrolledSubjects.map(sub => {
        const existing = studentMarks.find(m => m.subject_id === sub.id || m.subject_id === sub.code);
        const attMark = calculateAttendanceMarks(student.attendance_percentage);

        if (existing) {
          const ciaTotal = calculateCIAMarks(existing.cia1, existing.cia2);
          const testTotal = calculateTestMarks(existing.test1, existing.test2);
          const finalMarks = calculateFinalMarks(attMark, ciaTotal, testTotal);

          return {
            subject_id: sub.id,
            subject_code: sub.code,
            subject_name: sub.name,
            credits: sub.credits || 4,
            is_lab: sub.is_lab || false,
            cia1: existing.cia1,
            cia2: existing.cia2,
            test1: existing.test1,
            test2: existing.test2,
            ciaTotal,
            testTotal,
            attendanceMarks: attMark,
            attendancePercentage: student.attendance_percentage,
            final_marks: finalMarks,
            grade: existing.grade || (finalMarks >= 18 ? "O" : finalMarks >= 15 ? "A+" : finalMarks >= 12 ? "A" : "B+")
          };
        }

        // Default baseline calibrated to student's academic standing
        const baseCia = Math.min(5, Math.max(2, Math.round((student.cgpa / 10) * 5)));
        const baseTest = Math.min(10, Math.max(4, Math.round((student.cgpa / 10) * 10)));
        const finalM = calculateFinalMarks(attMark, baseCia, baseTest);

        return {
          subject_id: sub.id,
          subject_code: sub.code,
          subject_name: sub.name,
          credits: sub.credits || 4,
          is_lab: sub.is_lab || false,
          cia1: Math.min(10, Math.round((baseCia / 5) * 10)),
          cia2: Math.min(10, Math.round((baseCia / 5) * 10)),
          test1: Math.min(25, Math.round((baseTest / 10) * 25)),
          test2: Math.min(25, Math.round((baseTest / 10) * 25)),
          ciaTotal: baseCia,
          testTotal: baseTest,
          attendanceMarks: attMark,
          attendancePercentage: student.attendance_percentage,
          final_marks: finalM,
          grade: finalM >= 18 ? "O" : finalM >= 15 ? "A+" : finalM >= 12 ? "A" : "B+"
        };
      });

      return NextResponse.json({
        success: true,
        student: {
          id: student.id,
          name: student.name,
          roll_number: student.roll_number,
          register_number: student.register_number,
          class_name: student.class_name,
          attendance_percentage: student.attendance_percentage,
          cgpa: student.cgpa
        },
        data
      }, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }
      });
    }

    // 2. Class & Subject Query (for Faculty / Teacher Management)
    const classes = serverState.getClasses();
    const matchedClass = classes.find(c => c.id === classId || c.section === classId);
    const targetSection = matchedClass ? matchedClass.section : classId;

    const storedMarks = serverState.getMarks(classId || undefined, subjectId || undefined);

    const targetStudents = classId
      ? students.filter(s => s.section === targetSection || s.class_name.includes(targetSection || "") || s.class_name.includes(classId))
      : students;

    const result = targetStudents.map(s => {
      const existing = storedMarks.find(m => m.student_id === s.id || m.student_id === s.roll_number);
      const attMark = calculateAttendanceMarks(s.attendance_percentage);

      if (existing) {
        const ciaTotal = calculateCIAMarks(existing.cia1, existing.cia2);
        const testTotal = calculateTestMarks(existing.test1, existing.test2);
        const finalMarks = calculateFinalMarks(attMark, ciaTotal, testTotal);

        return {
          student_id: s.id,
          roll_number: s.roll_number,
          name: s.name,
          cia1: existing.cia1,
          cia2: existing.cia2,
          test1: existing.test1,
          test2: existing.test2,
          attendancePercentage: s.attendance_percentage,
          attendanceMarks: attMark,
          ciaTotal,
          testTotal,
          final_marks: finalMarks,
          grade: existing.grade || (finalMarks >= 18 ? "O" : finalMarks >= 15 ? "A+" : finalMarks >= 12 ? "A" : "B+")
        };
      }

      // Default baseline derived from student's cgpa and attendance
      const baseScore = Math.min(10, Math.max(4, Math.round((s.cgpa / 10) * 10)));
      const testScore = Math.min(25, Math.max(10, Math.round((s.cgpa / 10) * 25)));
      const ciaTotal = calculateCIAMarks(baseScore - 1, baseScore);
      const testTotal = calculateTestMarks(testScore - 2, testScore);
      const finalM = calculateFinalMarks(attMark, ciaTotal, testTotal);

      return {
        student_id: s.id,
        roll_number: s.roll_number,
        name: s.name,
        cia1: Math.max(0, baseScore - 1),
        cia2: baseScore,
        test1: Math.max(0, testScore - 2),
        test2: testScore,
        attendancePercentage: s.attendance_percentage,
        attendanceMarks: attMark,
        ciaTotal,
        testTotal,
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
      const attPct = Math.min(100, Math.max(0, Number(r.attendancePercentage) || 85));
      const attMark = calculateAttendanceMarks(attPct);
      
      // Strict clamping for continuous assessment components
      const cia1 = Math.min(10, Math.max(0, Number(r.cia1) || 0));
      const cia2 = Math.min(10, Math.max(0, Number(r.cia2) || 0));
      const test1 = Math.min(25, Math.max(0, Number(r.test1) || 0));
      const test2 = Math.min(25, Math.max(0, Number(r.test2) || 0));

      const ciaTotal = calculateCIAMarks(cia1, cia2);
      const testTotal = calculateTestMarks(test1, test2);
      const finalScore = calculateFinalMarks(attMark, ciaTotal, testTotal);

      return {
        id: `mk-${Date.now()}-${r.student_id || r.roll_number}`,
        student_id: r.student_id || r.roll_number,
        subject_id: subject_id || "sub-cs401",
        class_id: class_id || "cls-csa",
        cia1,
        cia2,
        test1,
        test2,
        attendance_score: attMark,
        final_marks: finalScore,
        grade: finalScore >= 18 ? "O" : finalScore >= 15 ? "A+" : finalScore >= 12 ? "A" : finalScore >= 10 ? "B+" : "B",
        updated_at: new Date().toISOString()
      };
    });

    serverState.saveMarks(marksRecords);

    // Invalidate caches so student, parent, and reports see updated values immediately
    cacheManager.invalidateTags(["marks", "ward", "student", "registry", "classes"]);

    serverState.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "MARKS_EVALUATION_LOCK",
      entity_type: "marks",
      performed_by: "Course Faculty",
      details: `Saved continuous assessment marks for ${marksRecords.length} students (Subject: ${subject_id || "CS401"})`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      count: marksRecords.length, 
      message: `Successfully synchronized ${marksRecords.length} student marks to institutional registry.` 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

