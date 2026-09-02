/**
 * ATTENDEX — Institutional Proctor Time Slot & Collision Management
 */

import { serverState, ServerProctorRequest } from "./server-state";

export const INSTITUTION_PROCTOR_SLOTS = [
  "10:00 AM – 10:30 AM",
  "10:30 AM – 11:00 AM",
  "11:00 AM – 11:30 AM",
  "03:30 PM – 04:00 PM",
  "04:00 PM – 04:30 PM",
  "04:30 PM – 05:00 PM"
] as const;

export interface SlotAvailability {
  slot: string;
  isBlocked: boolean;
  bookedByStudent?: string;
  topic?: string;
  requestId?: string;
}

/**
 * Normalizes time strings for collision comparison
 */
export function normalizeSlotTime(time: string): string {
  return time.trim().replace(/\s*-\s*/g, " – ").toUpperCase();
}

/**
 * Retrieves all slots for a given date with real collision status
 */
export function getSlotsForDate(date: string, excludeRequestId?: string): SlotAvailability[] {
  const allRequests = serverState.getProctorRequests();
  
  // Find active scheduled/completed meetings on this date
  const activeMeetings = allRequests.filter(r => 
    r.status !== "CANCELLED" &&
    r.scheduledDate === date &&
    r.id !== excludeRequestId
  );

  return INSTITUTION_PROCTOR_SLOTS.map(slot => {
    const normSlot = normalizeSlotTime(slot);
    const existing = activeMeetings.find(m => {
      if (!m.scheduledTime) return false;
      const normMeetingTime = normalizeSlotTime(m.scheduledTime);
      return normMeetingTime === normSlot || normSlot.startsWith(normMeetingTime) || normMeetingTime.startsWith(normSlot.split(" – ")[0]);
    });

    if (existing) {
      return {
        slot,
        isBlocked: true,
        bookedByStudent: `${existing.studentName} (${existing.rollNumber})`,
        topic: existing.topic,
        requestId: existing.id
      };
    }

    return {
      slot,
      isBlocked: false
    };
  });
}

/**
 * Checks if a proposed slot collides with an existing active meeting
 */
export function checkSlotCollision(date: string, time: string, excludeRequestId?: string): { collides: boolean; conflictingMeeting?: ServerProctorRequest } {
  const normProposed = normalizeSlotTime(time);
  const allRequests = serverState.getProctorRequests();
  
  const conflicting = allRequests.find(r => {
    if (r.id === excludeRequestId || r.status === "CANCELLED") return false;
    if (r.scheduledDate !== date) return false;
    if (!r.scheduledTime) return false;
    
    const normExisting = normalizeSlotTime(r.scheduledTime);
    return (
      normExisting === normProposed ||
      normExisting.startsWith(normProposed.split(" – ")[0]) ||
      normProposed.startsWith(normExisting.split(" – ")[0])
    );
  });

  return {
    collides: Boolean(conflicting),
    conflictingMeeting: conflicting
  };
}
