import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { serverState } from "@/lib/server-state";
import { supabase } from "@/lib/supabase";

const bookConsultationSchema = z.object({
  studentId: z.string().optional(),
  studentName: z.string().default("Rahul Deshmukh"),
  rollNumber: z.string().default("21CS042"),
  className: z.string().default("B.Tech CSE - 4A"),
  proctorName: z.string().default("Dr. Pavan Kulkarni"),
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  message: z.string().min(5, "Message must be at least 5 characters"),
  preferredTime: z.string().optional(),
  contactPhone: z.string().optional().default("+91 98450 12345"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = bookConsultationSchema.parse(body);

    const requestId = randomUUID();
    const displayCode = `PR-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRequest = {
      id: requestId,
      displayCode,
      studentId: validated.studentId || "00000000-0000-0000-0000-000000000030",
      studentName: validated.studentName,
      rollNumber: validated.rollNumber,
      className: validated.className,
      proctorName: validated.proctorName,
      topic: validated.topic,
      message: validated.message,
      preferredTime: validated.preferredTime || "Anytime (Office Hours)",
      contactPhone: validated.contactPhone,
      status: "PENDING" as const,
      createdAt: new Date().toISOString()
    };

    // 1. Write to persistent shared file store
    serverState.addProctorRequest(newRequest);

    // 2. Try inserting audit log into PostgreSQL
    try {
      await supabase.from("audit_logs").insert({
        institution_id: "00000000-0000-0000-0000-000000000001",
        actor_id: "00000000-0000-0000-0000-000000000005",
        action: "PROCTOR_CONSULTATION_REQUESTED",
        entity_type: "proctor_meetings",
        entity_id: requestId,
        metadata: {
          topic: validated.topic,
          message: validated.message,
          student: validated.studentName
        }
      });
    } catch {
      // Memory/File state is active
    }

    return NextResponse.json({
      success: true,
      requestId,
      displayCode,
      message: `Consultation request dispatched to ${validated.proctorName}. Callback scheduled within 24 hours.`,
      data: newRequest
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.errors?.[0]?.message || error.message || "Failed to book proctor consultation." },
      { status: 400 }
    );
  }
}
