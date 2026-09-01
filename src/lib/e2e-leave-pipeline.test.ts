import { test } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = "http://localhost:3001";

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

  const res = await fetch(`${BASE_URL}/api/leave/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 200, "API must return HTTP 200");
  const json = await res.json();
  assert.equal(json.success, true, "Response success must be true");
  assert.ok(json.leaveId, "Generated RFC-4122 leaveId must be present");
  assert.ok(json.displayCode, "Display badge (e.g. LV-8091) must be present");

  // Verify record exists in authoritative server query
  const queryRes = await fetch(`${BASE_URL}/api/leave`);
  const queryJson = await queryRes.json();
  const created = queryJson.data.find((l: any) => l.id === json.leaveId);

  assert.ok(created, "Submitted leave record must exist in authoritative query");
  assert.equal(created.status, "PENDING");
  assert.equal(created.leaveType, "MEDICAL");
  assert.equal(created.reason, payload.reason);
});

test("E2E PIPELINE: Test 2 - Teacher Retrieves Pending Requests from Backend Queue", async () => {
  const uniqueReason = `Clinical cardiology checkup - Ref #${Date.now()}`;
  const submitRes = await fetch(`${BASE_URL}/api/leave/submit`, {
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
  const submitJson = await submitRes.json();
  const createdId = submitJson.leaveId;

  // Teacher queries the leave queue
  const queryRes = await fetch(`${BASE_URL}/api/leave`);
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
  const submitRes = await fetch(`${BASE_URL}/api/leave/submit`, {
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
  const { leaveId } = await submitRes.json();

  // 2. Teacher approves
  const decideRes = await fetch(`${BASE_URL}/api/leave/decide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leaveId,
      decision: "APPROVED",
      reviewNotes: "Verified with parent over phone. Attendance condoned."
    })
  });
  assert.equal(decideRes.status, 200);
  const decideJson = await decideRes.json();
  assert.equal(decideJson.success, true);

  // 3. Verify status in authoritative query
  const verifyRes = await fetch(`${BASE_URL}/api/leave`);
  const verifyJson = await verifyRes.json();
  const updated = verifyJson.data.find((l: any) => l.id === leaveId);

  assert.ok(updated);
  assert.equal(updated.status, "APPROVED");
  assert.ok(updated.reviewedBy);
});

test("E2E PIPELINE: Test 4 - Teacher Rejection with Mandatory Explanation Note", async () => {
  const submitRes = await fetch(`${BASE_URL}/api/leave/submit`, {
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
  const { leaveId } = await submitRes.json();

  // 1. Reject without note -> Must be rejected with HTTP 400
  const invalidReject = await fetch(`${BASE_URL}/api/leave/decide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leaveId,
      decision: "REJECTED",
      reviewNotes: ""
    })
  });
  assert.equal(invalidReject.status, 400, "Rejection without reason must fail with HTTP 400");

  // 2. Reject with valid note -> Must succeed
  const validReject = await fetch(`${BASE_URL}/api/leave/decide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leaveId,
      decision: "REJECTED",
      reviewNotes: "Attendance below 75% threshold. Casual leave not permitted during midterms."
    })
  });
  assert.equal(validReject.status, 200);

  // 3. Verify in authoritative query
  const verifyRes = await fetch(`${BASE_URL}/api/leave`);
  const verifyJson = await verifyRes.json();
  const rejected = verifyJson.data.find((l: any) => l.id === leaveId);

  assert.ok(rejected);
  assert.equal(rejected.status, "REJECTED");
  assert.equal(rejected.reviewNotes, "Attendance below 75% threshold. Casual leave not permitted during midterms.");
});

test("E2E PIPELINE: Test 5 - Validation & Error Boundaries (Invalid Date Order)", async () => {
  const invalidRes = await fetch(`${BASE_URL}/api/leave/submit`, {
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

  assert.equal(invalidRes.status, 400);
  const json = await invalidRes.json();
  assert.equal(json.success, false);
});

test("E2E PIPELINE: Test 6 - Gatepass Submission and Cryptographic QR Nonce Generation", async () => {
  const res = await fetch(`${BASE_URL}/api/gatepass/submit`, {
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

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.gatepassId);
  assert.ok(json.qrNonce);
});
