import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as submitGatepass } from "@/app/api/gatepass/submit/route";
import { GET as getGatepasses } from "@/app/api/gatepass/route";
import { POST as decideGatepass } from "@/app/api/gatepass/decide/route";
import { formatDateDDMMYYYY } from "@/lib/utils";

test("GATEPASS PIPELINE: Test 1 - Student Submits Gatepass Request", async () => {
  const payload = {
    studentId: "00000000-0000-0000-0000-000000000032",
    studentName: "Priya Patel",
    rollNumber: "21CS002",
    exitTime: "14:30",
    expectedReturn: "18:00",
    destination: "City Diagnostic Center",
    reason: "Emergency health checkup with doctor appointment.",
    emergencyContact: "+91 98450 12345"
  };

  const req = new NextRequest("http://localhost:3000/api/gatepass/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const res = await submitGatepass(req);
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.ok(json.gatepassId, "Expected gatepassId in response");
  assert.ok(json.displayCode, "Expected displayCode in response");
  assert.ok(json.qrNonce, "Expected cryptographic QR nonce in response");
});

test("GATEPASS PIPELINE: Test 2 - Teacher / Warden Retrieves Pending Gatepasses", async () => {
  const res = await getGatepasses();
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data));

  const priyaPass = json.data.find((g: any) => g.rollNumber === "21CS002");
  assert.ok(priyaPass, "Expected Priya Patel's gatepass in pending list");
  assert.equal(priyaPass.status, "PENDING");
});

test("GATEPASS PIPELINE: Test 3 - Teacher Approves Gatepass Request", async () => {
  const submitReq = new NextRequest("http://localhost:3000/api/gatepass/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentName: "Priya Patel",
      rollNumber: "21CS002",
      exitTime: "16:00",
      expectedReturn: "19:00",
      destination: "City Lab",
      reason: "Lab research experiment.",
      emergencyContact: "+91 98450 12345"
    })
  });
  const submitRes = await submitGatepass(submitReq);
  const { gatepassId } = await submitRes.json();
  assert.ok(gatepassId);

  const req = new NextRequest("http://localhost:3000/api/gatepass/decide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gatepassId,
      decision: "APPROVED",
      decidedBy: "Dr. S. Kulkarni (Warden)"
    })
  });

  const res = await decideGatepass(req);
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);

  // Verify updated state
  const verifyRes = await getGatepasses();
  const verifyJson = await verifyRes.json();
  const updatedPass = verifyJson.data.find((g: any) => g.id === gatepassId || g.reason === "Lab research experiment.");
  assert.ok(updatedPass);
  assert.equal(updatedPass.status, "APPROVED");
  assert.ok(updatedPass.reviewedBy);
});

test("GATEPASS PIPELINE: Test 4 - Date & Time Formatting Verification", () => {
  assert.equal(formatDateDDMMYYYY("2026-09-15"), "15/09/2026");
  assert.equal(formatDateDDMMYYYY("2026-12-01T10:00:00Z"), "01/12/2026");
});
