import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { serverState } from "@/lib/server-state";
import { supabase } from "@/lib/supabase";
import { checkSlotCollision } from "@/lib/proctor-slots";

const bookConsultationSchema = z.object({
  studentId: z.string().optional(),
  studentName: z.string().default("Rahul Deshmukh"),
  rollNumber: z.string().default("21CS042"),
  className: z.string().default("B.Tech CSE - 4A"),
  proctorName: z.string().default("Dr. Pavan Kulkarni"),
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  message: z.string().min(5, "Message must be at least 5 characters"),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  contactPhone: z.string().optional().default("+91 98450 12345"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = bookConsultationSchema.parse(body);

    const targetDate = validated.preferredDate || new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const targetTime = validated.preferredTime || "03:30 PM – 04:00 PM";

    // Check collision if explicit slot selected
    const { collides, conflictingMeeting } = checkSlotCollision(targetDate, targetTime);
    if (collides && conflictingMeeting) {
      return NextResponse.json(
        {
          success: false,
          message: `Slot collision: "${targetTime}" on ${targetDate} is already reserved by another consultation. Please select an available slot.`,
          conflictingMeetingId: conflictingMeeting.id
        },
        { status: 409 }
      );
    }

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
      preferredTime: targetTime,
      scheduledDate: targetDate,
      scheduledTime: targetTime,
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
          date: targetDate,
          time: targetTime,
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
      message: `Consultation reserved for ${targetDate} (${targetTime}) with ${validated.proctorName}.`,
      data: newRequest
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.errors?.[0]?.message || error.message || "Failed to book proctor consultation." },
      { status: 400 }
    );
  }
}
