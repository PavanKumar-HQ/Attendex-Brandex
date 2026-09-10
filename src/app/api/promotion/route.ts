import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/server-state";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { class_ids } = body;

    if (!class_ids || !Array.isArray(class_ids) || class_ids.length === 0) {
      return NextResponse.json({ success: false, error: "Please select at least one class to promote" }, { status: 400 });
    }

    const allClasses = serverState.getClasses();
    const allStudents = serverState.getStudents();
    let promotedClassCount = 0;
    let promotedStudentCount = 0;

    for (const classId of class_ids) {
      const cls = allClasses.find(c => c.id === classId);
      if (cls) {
        if (cls.year >= 4) {
          // Final-year graduating cohort
          serverState.updateClass(classId, {
            academic_year: `${2026 + cls.year - 1}-${2027 + cls.year - 1}`
          });
          promotedClassCount++;

          for (const st of allStudents) {
            if (st.class_name.includes(cls.section) || st.section === cls.section) {
              promotedStudentCount++;
            }
          }
        } else {
          const nextYear = cls.year + 1;
          const nextSem = cls.semester + 2;
          const nextAcademicYear = `${2026 + cls.year - 1}-${2027 + cls.year - 1}`;

          serverState.updateClass(classId, {
            year: nextYear,
            semester: nextSem,
            academic_year: nextAcademicYear
          });
          promotedClassCount++;

          // Advance all students in this class and initialize clean standing for new semester
          for (const st of allStudents) {
            if (st.class_name.includes(cls.section) || st.section === cls.section) {
              serverState.updateStudent(st.id, {
                year: nextYear,
                semester: nextSem,
                total_sessions: 0,
                attended_sessions: 0,
                attendance_percentage: 100.0
              });
              promotedStudentCount++;
            }
          }
        }
      }
    }

    serverState.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "ACADEMIC_YEAR_BATCH_PROMOTION",
      entity_type: "classes",
      performed_by: "Dean of Academic Affairs",
      details: `Promoted ${promotedClassCount} class batches (${promotedStudentCount} students moved to next academic year)`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      promotedClasses: promotedClassCount,
      promotedStudents: promotedStudentCount,
      message: `Successfully promoted ${promotedClassCount} batches and ${promotedStudentCount} students to next academic tier.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
