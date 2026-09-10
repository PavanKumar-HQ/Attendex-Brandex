import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { serverState } from "@/lib/server-state";

const submitLeaveSchema = z.object({
  studentId: z.string().optional(),
  studentName: z.string().min(1),
  rollNumber: z.string().min(1),
  className: z.string().default("B.Tech CSE - 4A"),
  leaveType: z.enum(["MEDICAL", "ON_DUTY", "FAMILY_EMERGENCY", "SPORTS", "CASUAL"]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  documentUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = submitLeaveSchema.parse(body);

    if (new Date(validated.endDate) < new Date(validated.startDate)) {
      return NextResponse.json(
        { success: false, message: "End date cannot precede start date." },
        { status: 400 }
      );
    }

    const leaveId = randomUUID();
    const displayCode = `LV-${Math.floor(1000 + Math.random() * 9000)}`;
    const institutionId = "00000000-0000-0000-0000-000000000001";
    const studentId = validated.studentId || "00000000-0000-0000-0000-000000000030";
    const appliedByUserId = "aa000000-0000-0000-0000-000000000005";

    // 1. Write to persistent file store (guaranteed cross-process)
    serverState.addLeave({
      id: leaveId,
      displayCode,
      studentId,
      studentName: validated.studentName,
      rollNumber: validated.rollNumber,
      className: validated.className,
      leaveType: validated.leaveType,
      startDate: validated.startDate,
      endDate: validated.endDate,
      reason: validated.reason,
      status: "PENDING",
      createdAt: new Date().toISOString()
    });

    // 2. Try to persist to Supabase PostgreSQL (schema-aligned)
    try {
      const student = serverState.getStudents().find(s => 
        s.id === studentId || 
        s.roll_number.toLowerCase() === validated.rollNumber.toLowerCase()
      );
      const targetStudentId = (student && student.id.startsWith("cc")) ? student.id : "cc000000-0000-0000-0000-000000000001";
      const dbLeaveType = validated.leaveType === "FAMILY_EMERGENCY" 
        ? "EMERGENCY" 
        : validated.leaveType === "SPORTS" 
        ? "ON_DUTY" 
        : validated.leaveType;

      const { error: lvErr } = await supabase
        .from("leave_requests")
        .insert({
          id: leaveId,
          institution_id: institutionId,
          student_id: targetStudentId,
          applied_by_user_id: "aa000000-0000-0000-0000-000000000005",
          leave_type: dbLeaveType,
          start_date: validated.startDate,
          end_date: validated.endDate,
          reason: validated.reason,
          document_url: validated.documentUrl || null,
          status: "PENDING"
        });

      if (lvErr) {
        console.warn("[Supabase Sync Warning] leave_requests:", lvErr.message);
      }
    } catch (err: any) {
      console.warn("[Supabase Network/Driver Exception leave]:", err?.message);
    }

    return NextResponse.json({
      success: true,
      leaveId,
      displayCode,
      message: "Leave application registered and forwarded to Class Teacher."
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.errors?.[0]?.message || error.message || "Failed to submit leave." },
      { status: 400 }
    );
  }
}
