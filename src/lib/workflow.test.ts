import { test } from "node:test";
import assert from "node:assert/strict";
import { leaveService } from "@/services/leave.service";
import { workflowService } from "@/services/workflow.service";
import { gatepassService } from "@/services/gatepass.service";
import { universalWorkflow } from "@/lib/workflow-engine";

// ─── 1. Leave Domain & State Machine Tests ───────────────────────────────────

test("Workflow Engine: Invalid date range (end before start) is strictly rejected", async () => {
  const result = await leaveService.submitLeave({
    studentId: "00000000-0000-0000-0000-000000000030",
    leaveType: "MEDICAL",
    startDate: "2026-09-10",
    endDate: "2026-09-05", // invalid!
    reason: "Going out of station for family emergency."
  });

  assert.equal(result.success, false);
  assert.match(result.message, /precede start date/i);
});

test("Workflow Engine: Missing or short reason (< 5 characters) is rejected", async () => {
  const result = await leaveService.submitLeave({
    studentId: "00000000-0000-0000-0000-000000000030",
    leaveType: "CASUAL",
    startDate: "2026-09-05",
    endDate: "2026-09-05",
    reason: "Sick" // only 4 chars!
  });

  assert.equal(result.success, false);
  assert.match(result.message, /minimum 5 characters/i);
});

test("Workflow Engine: Rejection requires mandatory explanation comment", async () => {
  const result = await workflowService.processDecision("task-1", "REJECTED", "");
  assert.equal(result.success, false);
  assert.match(result.message, /mandatory rejection reason/i);
});

test("Workflow Engine: State Machine allows PENDING -> APPROVED transition", async () => {
  const submitRes = await universalWorkflow.submitLeave({
    studentName: "Rahul Deshmukh",
    rollNumber: "21CS042",
    leaveType: "MEDICAL",
    startDate: "2026-09-05",
    endDate: "2026-09-07",
    reason: "Acute viral infection with hospital prescription attached."
  });

  assert.equal(submitRes.success, true);
  assert.ok(submitRes.leaveId);

  // Approve
  const approveRes = await universalWorkflow.decideLeave(submitRes.leaveId, "APPROVED", "Verified medical prescription.");
  assert.equal(approveRes.success, true);

  const leaves = universalWorkflow.getAllLeaves();
  const target = leaves.find(l => l.id === submitRes.leaveId);
  assert.equal(target?.status, "APPROVED");
  assert.ok(target?.reviewedBy);
});

test("Workflow Engine: State Machine allows PENDING -> CANCELLED by parent", async () => {
  const submitRes = await universalWorkflow.submitLeave({
    studentName: "Rahul Deshmukh",
    rollNumber: "21CS042",
    leaveType: "CASUAL",
    startDate: "2026-09-12",
    endDate: "2026-09-12",
    reason: "Family function attending out of city."
  });

  const cancelRes = universalWorkflow.cancelLeave(submitRes.leaveId);
  assert.equal(cancelRes.success, true);

  const leaves = universalWorkflow.getAllLeaves();
  const target = leaves.find(l => l.id === submitRes.leaveId);
  assert.equal(target?.status, "CANCELLED");
});

// ─── 2. Gatepass Domain Tests ────────────────────────────────────────────────

test("Workflow Engine: Gatepass validation rejects missing destination or reason", async () => {
  const result = await gatepassService.submitGatepass({
    studentId: "00000000-0000-0000-0000-000000000030",
    exitTime: "2026-09-02T14:00:00Z",
    expectedReturn: "2026-09-02T18:00:00Z",
    destination: "",
    reason: "",
    emergencyContact: "+91 98450 12345"
  });

  assert.equal(result.success, false);
  assert.match(result.message, /destination and purpose/i);
});

test("Workflow Engine: Gatepass submission produces cryptographic QR nonce", async () => {
  const result = await universalWorkflow.submitGatepass({
    studentName: "Rahul Deshmukh",
    rollNumber: "21CS042",
    exitTime: "Today 03:00 PM",
    expectedReturn: "Today 07:00 PM",
    destination: "City Medical Center",
    reason: "Diagnostic checkup",
    emergencyContact: "+91 98450 12345"
  });

  assert.equal(result.success, true);
  assert.ok(result.gatepassId);

  const passes = universalWorkflow.getAllGatepasses();
  const gp = passes.find(g => g.id === result.gatepassId);
  assert.ok(gp?.qrNonce);
  assert.match(gp!.qrNonce!, /^GP-/);
});

// ─── 3. Concurrency Protection & Idempotency Tests ───────────────────────────

test("Workflow Engine: Non-existent leave decision yields safe error", async () => {
  const res = await universalWorkflow.decideLeave("NON-EXISTENT-ID-9999", "APPROVED");
  assert.equal(res.success, false);
  assert.match(res.message, /not found/i);
});
