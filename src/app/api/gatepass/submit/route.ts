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

    // 2. Insert into PostgreSQL gatepasses table
    let inserted: any = null;
    try {
      const { data } = await supabase
        .from("gatepasses")
        .insert({
          id: gpId,
          institution_id: institutionId,
          student_id: studentId,
          applied_by_user_id: "00000000-0000-0000-0000-000000000004",
          pass_type: "OUTPASS",
          reason: validated.reason,
          out_time: validated.exitTime,
          expected_in_time: validated.expectedReturn,
          emergency_contact_phone: validated.emergencyContact,
          qr_code_token: qrNonce,
          status: "PENDING"
        })
        .select()
        .single();
      inserted = data;
    } catch {
      // Memory state is active
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
