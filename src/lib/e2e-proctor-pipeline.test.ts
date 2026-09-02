import test from "node:test";
import assert from "node:assert/strict";
import { GET as getProctorRequests } from "@/app/api/proctor/route";
import { POST as bookConsultation } from "@/app/api/proctor/book/route";
import { POST as decideConsultation } from "@/app/api/proctor/decide/route";
import { GET as getSlots } from "@/app/api/proctor/slots/route";

test("PROCTOR PIPELINE: Test 1 - Parent / Student Books Proctor Consultation with Specific Slot", async () => {
  const targetDate = "2026-10-15";
  const targetTime = "03:30 PM – 04:00 PM";

  const payload = {
    studentName: "Rahul Deshmukh",
    rollNumber: "21CS042",
    className: "B.Tech CSE - 4A",
    proctorName: "Dr. Pavan Kulkarni",
    topic: "Academic Attendance & CIA Feedback",
    message: "Requesting consultation regarding medical exemption and internal assessment guidance.",
    preferredDate: targetDate,
    preferredTime: targetTime,
    contactPhone: "+91 98450 12345"
  };

  const req = new Request("http://localhost:3000/api/proctor/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const res = await bookConsultation(req);
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.ok(json.requestId, "Expected requestId in response");
  assert.ok(json.displayCode, "Expected displayCode in response");
});

test("PROCTOR PIPELINE: Test 2 - Slot Query Reflects Reserved and Available Slots", async () => {
  const targetDate = "2026-10-15";
  const req = new Request(`http://localhost:3000/api/proctor/slots?date=${targetDate}`);
  const res = await getSlots(req);
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.equal(json.date, targetDate);
  assert.ok(Array.isArray(json.slots));
  assert.equal(json.slots.length, 6);

  const booked = json.slots.find((s: any) => s.slot === "03:30 PM – 04:00 PM");
  assert.ok(booked, "Expected slot to exist");
  assert.equal(booked.isBlocked, true, "Expected 03:30 PM slot to be blocked after reservation");
  assert.ok(booked.bookedByStudent?.includes("Rahul Deshmukh"));

  const openSlot = json.slots.find((s: any) => s.slot === "10:00 AM – 10:30 AM");
  assert.ok(openSlot);
  assert.equal(openSlot.isBlocked, false, "Expected 10:00 AM slot to be available");
});

test("PROCTOR PIPELINE: Test 3 - Collision Prevention Rejects Double-Booking Same Slot", async () => {
  const targetDate = "2026-10-15";
  const targetTime = "03:30 PM – 04:00 PM"; // Already booked in Test 1!

  const collidingPayload = {
    studentName: "Priya Patel",
    rollNumber: "21CS002",
    className: "B.Tech CSE - 4A",
    proctorName: "Dr. Pavan Kulkarni",
    topic: "Career Guidance",
    message: "Requesting slot for placement discussion.",
    preferredDate: targetDate,
    preferredTime: targetTime, // Colliding!
    contactPhone: "+91 98450 99999"
  };

  const req = new Request("http://localhost:3000/api/proctor/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(collidingPayload)
  });

  const res = await bookConsultation(req);
  const json = await res.json();

  assert.equal(res.status, 409, "Expected 409 Conflict status on slot collision");
  assert.equal(json.success, false);
  assert.ok(json.message.includes("collision") || json.message.includes("already reserved"));
});

test("PROCTOR PIPELINE: Test 4 - Faculty Confirms and Resolves Consultation", async () => {
  const listRes = await getProctorRequests();
  const listJson = await listRes.json();
  const pending = listJson.data.find((p: any) => p.status === "PENDING" && p.scheduledDate === "2026-10-15");
  assert.ok(pending, "Must find pending consultation");

  // Faculty schedules open slot 10:00 AM
  const scheduleReq = new Request("http://localhost:3000/api/proctor/decide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestId: pending.id,
      action: "SCHEDULED",
      scheduledDate: "2026-10-15",
      scheduledTime: "10:00 AM – 10:30 AM",
      meetingNotes: "Slot confirmed in CS Block Room 304."
    })
  });

  const scheduleRes = await decideConsultation(scheduleReq);
  const scheduleJson = await scheduleRes.json();

  assert.equal(scheduleRes.status, 200);
  assert.equal(scheduleJson.success, true);

  // Complete consultation
  const completeReq = new Request("http://localhost:3000/api/proctor/decide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestId: pending.id,
      action: "COMPLETED",
      meetingNotes: "Medical certificate verified. Condonation approved for 3 days of absence.",
      actionItems: "Resolved"
    })
  });

  const completeRes = await decideConsultation(completeReq);
  const completeJson = await completeRes.json();

  assert.equal(completeRes.status, 200);
  assert.equal(completeJson.success, true);
});
