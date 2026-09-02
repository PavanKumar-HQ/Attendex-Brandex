import test from "node:test";
import assert from "node:assert/strict";
import { GET as getProctorRequests } from "@/app/api/proctor/route";
import { POST as bookConsultation } from "@/app/api/proctor/book/route";
import { POST as decideConsultation } from "@/app/api/proctor/decide/route";

test("PROCTOR PIPELINE: Test 1 - Parent / Student Books Proctor Consultation", async () => {
  const payload = {
    studentName: "Rahul Deshmukh",
    rollNumber: "21CS042",
    className: "B.Tech CSE - 4A",
    proctorName: "Dr. Pavan Kulkarni",
    topic: "Academic Attendance & CIA Feedback",
    message: "Requesting a 15-minute consultation to discuss attendance regularisation for viral fever period.",
    preferredTime: "Afternoon (3:30 PM – 5:00 PM)",
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

test("PROCTOR PIPELINE: Test 2 - Faculty / Teacher Retrieves Pending Proctor Consultation Queue", async () => {
  const res = await getProctorRequests();
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data), "Expected data array");
  assert.ok(json.data.length > 0, "Expected at least one consultation record");

  const pending = json.data.find((p: any) => p.studentName === "Rahul Deshmukh" && p.status === "PENDING");
  assert.ok(pending, "Expected pending consultation request for Rahul Deshmukh");
  assert.equal(pending.topic, "Academic Attendance & CIA Feedback");
});

test("PROCTOR PIPELINE: Test 3 - Faculty Schedules and Completes Proctor Consultation", async () => {
  // 1. Get the pending request ID
  const listRes = await getProctorRequests();
  const listJson = await listRes.json();
  const pending = listJson.data.find((p: any) => p.status === "PENDING");
  assert.ok(pending, "Must have a pending consultation to decide");

  // 2. Faculty confirms slot
  const scheduleReq = new Request("http://localhost:3000/api/proctor/decide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestId: pending.id,
      action: "SCHEDULED",
      scheduledDate: "2026-09-08",
      scheduledTime: "04:00 PM",
      meetingNotes: "Slot confirmed in CS Block Room 304."
    })
  });

  const scheduleRes = await decideConsultation(scheduleReq);
  const scheduleJson = await scheduleRes.json();

  assert.equal(scheduleRes.status, 200);
  assert.equal(scheduleJson.success, true);

  // 3. Verify state updated
  const updatedListRes = await getProctorRequests();
  const updatedListJson = await updatedListRes.json();
  const updated = updatedListJson.data.find((p: any) => p.id === pending.id);
  assert.ok(updated);
  assert.equal(updated.status, "SCHEDULED");
  assert.equal(updated.scheduledDate, "2026-09-08");

  // 4. Complete and resolve meeting
  const completeReq = new Request("http://localhost:3000/api/proctor/decide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestId: pending.id,
      action: "COMPLETED",
      meetingNotes: "Met with parent. Medical certificates reviewed and approved for condonation.",
      actionItems: "Resolved"
    })
  });

  const completeRes = await decideConsultation(completeReq);
  const completeJson = await completeRes.json();

  assert.equal(completeRes.status, 200);
  assert.equal(completeJson.success, true);
});

test("PROCTOR PIPELINE: Test 4 - Validation Boundaries (Short Message Rejection)", async () => {
  const invalidReq = new Request("http://localhost:3000/api/proctor/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentName: "Rahul Deshmukh",
      topic: "CIA",
      message: "hi" // Too short (< 5 chars)
    })
  });

  const res = await bookConsultation(invalidReq);
  const json = await res.json();

  assert.equal(res.status, 400);
  assert.equal(json.success, false);
});
