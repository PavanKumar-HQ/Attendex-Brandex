import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/server-state";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");
    const studentRoll = searchParams.get("roll_number");

    const assignments = serverState.getAssignments(classId || undefined);

    const formatted = assignments.map(a => {
      const submission = studentRoll
        ? a.submissions.find(s => s.roll_number.toLowerCase() === studentRoll.toLowerCase())
        : undefined;

      return {
        id: a.id,
        title: a.title,
        subject: a.subject_name,
        instructor: a.instructor,
        deadline: a.deadline,
        status: submission ? submission.status : "Assigned",
        score: submission?.score || "Pending Evaluation",
        maxMarks: a.max_marks,
        type: a.title.toLowerCase().includes("lab") ? "Practical Lab" : "Theory Assignment",
        description: a.description,
        submissionLink: submission?.submission_url,
        submittedAt: submission?.submitted_at
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted
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
    const { assignment_id, student_id, student_name, roll_number, submission_url } = body;

    if (!assignment_id || !submission_url) {
      return NextResponse.json({ success: false, error: "Assignment ID and submission URL required" }, { status: 400 });
    }

    const assignments = serverState.getAssignments();
    const matchedAssignment = assignments.find(a => a.id === assignment_id);
    if (!matchedAssignment) {
      return NextResponse.json({
        success: false,
        error: `Assignment with ID "${assignment_id}" not found.`
      }, { status: 404 });
    }

    const now = new Date();
    const timestamp = `${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

    serverState.addAssignmentSubmission(assignment_id, {
      student_id: student_id || roll_number || "current-student",
      student_name: student_name || "Student",
      roll_number: roll_number || "CS-11",
      submission_url,
      submitted_at: timestamp,
      status: "Submitted",
      score: "Pending Faculty Evaluation"
    });

    serverState.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "ASSIGNMENT_SUBMISSION",
      entity_type: "assignments",
      entity_id: assignment_id,
      performed_by: student_name || roll_number,
      details: `Submitted work for ${assignment_id}`,
      timestamp: now.toISOString()
    });

    return NextResponse.json({
      success: true,
      message: "Assignment submitted successfully"
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
