import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as submitLeave } from "@/app/api/leave/submit/route";
import { GET as getLeaves } from "@/app/api/leave/route";
import { POST as decideLeave } from "@/app/api/leave/decide/route";
import { POST as submitGatepass } from "@/app/api/gatepass/submit/route";

test("E2E PIPELINE: Test 1 - Real Parent/Student Submission to Backend Engine", async () => {
  const payload = {
    studentName: "Rahul Deshmukh",
    rollNumber: "21CS042",
    className: "B.Tech CSE - 4A",
    leaveType: "MEDICAL",
    startDate: "2026-09-10",
    endDate: "2026-09-12",
    reason: "Severe fever and gastroenteritis requiring complete medical bed rest."
  };

  const req = new NextRequest("http://localhost:3000/api/leave/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const res = await submitLeave(req);
  assert.equal(res.status, 200, "API must return HTTP 200");
  const json = await res.json();
  assert.equal(json.success, true, "Response success must be true");
  assert.ok(json.leaveId, "Generated RFC-4122 leaveId must be present");
  assert.ok(json.displayCode, "Display badge (e.g. LV-8091) must be present");

  // Verify record exists in authoritative server query
  const queryRes = await getLeaves();
  const queryJson = await queryRes.json();
  const created = queryJson.data.find((l: any) => l.id === json.leaveId);

  assert.ok(created, "Submitted leave record must exist in authoritative query");
  assert.equal(created.status, "PENDING");
  assert.equal(created.leaveType, "MEDICAL");
  assert.equal(created.reason, payload.reason);
});

test("E2E PIPELINE: Test 2 - Teacher Retrieves Pending Requests from Backend Queue", async () => {
  const uniqueReason = `Clinical cardiology checkup - Ref #${Date.now()}`;
  const req = new NextRequest("http://localhost:3000/api/leave/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentName: "Rahul Deshmukh",
      rollNumber: "21CS042",
      className: "B.Tech CSE - 4A",
      leaveType: "ON_DUTY",
      startDate: "2026-09-15",
      endDate: "2026-09-16",
      reason: uniqueReason
    })
  });
  const submitRes = await submitLeave(req);
  const submitJson = await submitRes.json();
  const createdId = submitJson.leaveId;

  // Teacher queries the leave queue
  const queryRes = await getLeaves();
  assert.equal(queryRes.status, 200);
  const queryJson = await queryRes.json();
  assert.equal(queryJson.success, true);
  assert.ok(Array.isArray(queryJson.data));

  const found = queryJson.data.find((l: any) => l.id === createdId);
  assert.ok(found, "Teacher must retrieve the exact submitted leave record");
  assert.equal(found.status, "PENDING");
  assert.equal(found.reason, uniqueReason);
});

test("E2E PIPELINE: Test 3 - Teacher Approves Request and State Updates to APPROVED", async () => {
  // 1. Submit leave
  const submitReq = new NextRequest("http://localhost:3000/api/leave/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentName: "Rahul Deshmukh",
      rollNumber: "21CS042",
      className: "B.Tech CSE - 4A",
      leaveType: "FAMILY_EMERGENCY",
      startDate: "2026-09-20",
      endDate: "2026-09-21",
      reason: "Urgent family emergency in hometown with parental authorization."
    })
  });
  const submitRes = await submitLeave(submitReq);
  const { leaveId } = await submitRes.json();

  // 2. Teacher approves
  const decideReq = new NextRequest("http://localhost:3000/api/leave/decide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leaveId,
      decision: "APPROVED",
      reviewNotes: "Verified with parent over phone. Attendance condoned."
    })
  });
  const decideRes = await decideLeave(decideReq);
  assert.equal(decideRes.status, 200);
  const decideJson = await decideRes.json();
  assert.equal(decideJson.success, true);

  // 3. Verify status in authoritative query
  const verifyRes = await getLeaves();
  const verifyJson = await verifyRes.json();
  const updated = verifyJson.data.find((l: any) => l.id === leaveId);

  assert.ok(updated);
  assert.equal(updated.status, "APPROVED");
  assert.ok(updated.reviewedBy);
});

test("E2E PIPELINE: Test 4 - Teacher Rejection with Mandatory Explanation Note", async () => {
  const submitReq = new NextRequest("http://localhost:3000/api/leave/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentName: "Rahul Deshmukh",
      rollNumber: "21CS042",
      className: "B.Tech CSE - 4A",
      leaveType: "CASUAL",
      startDate: "2026-09-25",
      endDate: "2026-09-26",
      reason: "Casual absence request for festival preparation."
    })
  });
  const submitRes = await submitLeave(submitReq);
  const { leaveId } = await submitRes.json();

  // 1. Reject without note -> Must be rejected with HTTP 400
  const invalidRejectReq = new NextRequest("http://localhost:3000/api/leave/decide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leaveId,
      decision: "REJECTED",
      reviewNotes: ""
    })
  });
  const invalidReject = await decideLeave(invalidRejectReq);
  assert.equal(invalidReject.status, 400, "Rejection without reason must fail with HTTP 400");

  // 2. Reject with valid note -> Must succeed
  const validRejectReq = new NextRequest("http://localhost:3000/api/leave/decide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leaveId,
      decision: "REJECTED",
      reviewNotes: "Attendance below 75% threshold. Casual leave not permitted during midterms."
    })
  });
  const validReject = await decideLeave(validRejectReq);
  assert.equal(validReject.status, 200);

  // 3. Verify in authoritative query
  const verifyRes = await getLeaves();
  const verifyJson = await verifyRes.json();
  const rejected = verifyJson.data.find((l: any) => l.id === leaveId);

  assert.ok(rejected);
  assert.equal(rejected.status, "REJECTED");
  assert.equal(rejected.reviewNotes, "Attendance below 75% threshold. Casual leave not permitted during midterms.");
});

test("E2E PIPELINE: Test 5 - Validation & Error Boundaries (Invalid Date Order)", async () => {
  const invalidReq = new NextRequest("http://localhost:3000/api/leave/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentName: "Rahul Deshmukh",
      rollNumber: "21CS042",
      className: "B.Tech CSE - 4A",
      leaveType: "MEDICAL",
      startDate: "2026-09-20",
      endDate: "2026-09-10", // Invalid: before start
      reason: "Invalid date sequence."
    })
  });
  const invalidRes = await submitLeave(invalidReq);

  assert.equal(invalidRes.status, 400);
  const json = await invalidRes.json();
  assert.equal(json.success, false);
});

test("E2E PIPELINE: Test 6 - Gatepass Submission and Cryptographic QR Nonce Generation", async () => {
  const req = new NextRequest("http://localhost:3000/api/gatepass/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentName: "Rahul Deshmukh",
      rollNumber: "21CS042",
      exitTime: "Today 04:00 PM",
      expectedReturn: "Today 08:00 PM",
      destination: "City Medical Center",
      reason: "Specialist consultation",
      emergencyContact: "+91 98450 12345"
    })
  });
  const res = await submitGatepass(req);

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.gatepassId);
  assert.ok(json.qrNonce);
});
