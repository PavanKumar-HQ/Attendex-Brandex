import { test } from "node:test";
import assert from "node:assert/strict";
import { leaveService } from "@/services/leave.service";
import { workflowService } from "@/services/workflow.service";
import { gatepassService } from "@/services/gatepass.service";

test("Workflow Engine: Valid leave submission produces approval task", async () => {
  const result = await leaveService.submitLeave({
    studentId: "stud-1",
    studentName: "Rahul Kumar",
    rollNumber: "21CS042",
    leaveType: "MEDICAL",
    startDate: "2026-09-05",
    endDate: "2026-09-07",
    reason: "Severe viral fever with hospital medical prescription."
  });

  assert.equal(result.success, true);
  assert.ok(result.leaveId);
});

test("Workflow Engine: Invalid date range (end before start) is strictly rejected", async () => {
  const result = await leaveService.submitLeave({
    studentId: "stud-1",
    leaveType: "MEDICAL",
    startDate: "2026-09-10",
    endDate: "2026-09-05", // invalid!
    reason: "Going out of station."
  });

  assert.equal(result.success, false);
  assert.match(result.message, /precede start date/i);
});

test("Workflow Engine: Missing or short reason (< 5 characters) is rejected", async () => {
  const result = await leaveService.submitLeave({
    studentId: "stud-1",
    leaveType: "CASUAL",
    startDate: "2026-09-05",
    endDate: "2026-09-05",
    reason: "Sick" // only 4 chars!
  });

  assert.equal(result.success, false);
  assert.match(result.message, /minimum 5 characters/i);
});

test("Workflow Engine: Pending leave can be cancelled by parent", async () => {
  const cancelResult = await leaveService.cancelLeave("leave-101");
  assert.equal(cancelResult.success, true);
  assert.match(cancelResult.message, /cancelled/i);
});

test("Workflow Engine: Rejection requires mandatory explanation comment", async () => {
  const result = await workflowService.processDecision("task-1", "REJECTED", "");
  assert.equal(result.success, false);
  assert.match(result.message, /mandatory rejection reason/i);
});

test("Workflow Engine: Valid approval records decision and dispatches updates", async () => {
  const result = await workflowService.processDecision("task-1", "APPROVED", "Approved after doctor verification.");
  assert.equal(result.success, true);
});

test("Workflow Engine: Gatepass submission creates pending entry with emergency contact", async () => {
  const result = await gatepassService.submitGatepass({
    studentId: "stud-1",
    exitTime: "2026-09-02T14:00:00Z",
    expectedReturn: "2026-09-02T18:00:00Z",
    destination: "City Medical Center",
    reason: "Routine diagnostic blood work.",
    emergencyContact: "+91 98450 12345 (Father)"
  });

  assert.equal(result.success, true);
  assert.ok(result.gatepassId);
});
