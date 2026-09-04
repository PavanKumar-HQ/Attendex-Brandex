import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as submitAttendance } from "@/app/api/attendance/submit/route";
import { calculateAttendanceMetrics } from "@/lib/calculations";

test("ATTENDANCE PIPELINE: Test 1 - Teacher Submits Period Roll-Call", async () => {
  const payload = {
    classId: "00000000-0000-0000-0000-000000000020",
    subjectId: "00000000-0000-0000-0000-000000000040",
    date: "2026-09-02",
    period: 1,
    records: [
      { studentId: "00000000-0000-0000-0000-000000000030", status: "PRESENT" },
      { studentId: "00000000-0000-0000-0000-000000000031", status: "PRESENT" },
      { studentId: "00000000-0000-0000-0000-000000000032", status: "ABSENT" }
    ]
  };

  const req = new NextRequest("http://localhost:3000/api/attendance/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const res = await submitAttendance(req);
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.ok(json.sessionId, "Expected sessionId in response");
});

test("ATTENDANCE PIPELINE: Test 2 - Recalculate Standing and Shortage Alerts", () => {
  // Student with 38 present out of 40 classes -> 95%
  const goodMetrics = calculateAttendanceMetrics(38, 40, 75);
  assert.equal(goodMetrics.percentage, 95);
  assert.equal(goodMetrics.status, "Good Standing");
  assert.ok(goodMetrics.safeSkips > 0);

  // Student with 28 present out of 40 classes -> 70%
  const shortageMetrics = calculateAttendanceMetrics(28, 40, 75);
  assert.equal(shortageMetrics.percentage, 70);
  assert.equal(shortageMetrics.status, "Shortage Alert");
  assert.ok(shortageMetrics.recoveryClasses > 0);
});
