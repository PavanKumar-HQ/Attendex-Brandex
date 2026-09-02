import { NextRequest, NextResponse } from "next/server";
import { getSlotsForDate } from "@/lib/proctor-slots";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const excludeRequestId = searchParams.get("excludeId") || undefined;

  const slots = getSlotsForDate(date, excludeRequestId);
  const totalSlots = slots.length;
  const availableSlots = slots.filter(s => !s.isBlocked).length;
  const blockedSlots = slots.filter(s => s.isBlocked).length;

  return NextResponse.json({
    success: true,
    date,
    totalSlots,
    availableSlots,
    blockedSlots,
    slots
  });
}
