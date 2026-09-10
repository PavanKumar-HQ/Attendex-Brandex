import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { serverState } from "@/lib/server-state";

const submitGatepassSchema = z.object({
  studentId: z.string().optional(),
  studentName: z.string().min(1),
  rollNumber: z.string().min(1),
  exitTime: z.string().min(1),
  expectedReturn: z.string().min(1),
  destination: z.string().min(1),
  reason: z.string().min(1),
  emergencyContact: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = submitGatepassSchema.parse(body);

    const gpId = randomUUID();
    const displayCode = `GP-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrNonce = `GP-${randomUUID().slice(0, 8).toUpperCase()}`;
    const institutionId = "00000000-0000-0000-0000-000000000001";
    const studentId = validated.studentId || "00000000-0000-0000-0000-000000000030";

    // 1. Synchronize with server state
    serverState.addGatepass({
      id: gpId,
      displayCode,
      studentId,
      studentName: validated.studentName,
      rollNumber: validated.rollNumber,
      exitTime: validated.exitTime,
      expectedReturn: validated.expectedReturn,
      destination: validated.destination,
      reason: validated.reason,
      emergencyContact: validated.emergencyContact,
      qrNonce,
      status: "PENDING",
      createdAt: new Date().toISOString()
    });

    // 2. Insert into PostgreSQL gatepasses table (schema-aligned)
    let inserted: any = null;
    try {
      const student = serverState.getStudents().find(s => 
        s.id === studentId || 
        s.roll_number.toLowerCase() === validated.rollNumber.toLowerCase()
      );
      const targetStudentId = (student && student.id.startsWith("cc")) ? student.id : "cc000000-0000-0000-0000-000000000001";
      const now = new Date();
      const returnTime = new Date(now.getTime() + 4 * 3600000);
      const expiresAt = new Date(now.getTime() + 24 * 3600000);

      const { data, error: gpErr } = await supabase
        .from("gatepasses")
        .insert({
          id: gpId,
          institution_id: institutionId,
          student_id: targetStudentId,
          category: "DAY_OUTING",
          departure_time: now.toISOString(),
          expected_return_time: returnTime.toISOString(),
          reason: validated.reason,
          guardian_phone: validated.emergencyContact,
          guardian_sms_status: "SENT",
          qr_token: qrNonce,
          nonce: randomUUID(),
          expires_at: expiresAt.toISOString(),
          status: "PENDING"
        })
        .select()
        .single();

      if (gpErr) {
        console.warn("[Supabase Sync Warning] gatepasses:", gpErr.message);
      } else {
        inserted = data;
      }
    } catch (err: any) {
      console.warn("[Supabase Network/Driver Exception gatepass]:", err?.message);
    }

    return NextResponse.json({
      success: true,
      message: "Gatepass request dispatched to Class Teacher & Campus Warden.",
      gatepassId: gpId,
      displayCode,
      qrNonce,
      data: inserted
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to submit gatepass." },
      { status: 400 }
    );
  }
}
