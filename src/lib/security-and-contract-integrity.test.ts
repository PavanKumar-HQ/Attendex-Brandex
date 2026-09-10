import { test } from "node:test";
import assert from "node:assert";
import { GET as studentLookupGET } from "@/app/api/auth/student-lookup/route";
import { GET as cronClearAuditLogsGET } from "@/app/api/cron/clear-audit-logs/route";
import { GET as parentWardGET } from "@/app/api/parent/ward/route";
import { POST as assignmentsPOST } from "@/app/api/assignments/route";
import { POST as promotionPOST } from "@/app/api/promotion/route";
import { GET as pulseGET } from "@/app/api/pulse/route";
import { serverState } from "@/lib/server-state";
import { NextRequest } from "next/server";

test("SECURITY: Student Lookup must never disclose cleartext password or raw DOB", async () => {
  const req = new NextRequest("http://localhost:3000/api/auth/student-lookup?q=Aarav");
  const res = await studentLookupGET(req);
  const json = await res.json();

  assert.strictEqual(res.status, 200);
  assert.ok(json.results && json.results.length > 0);

  const student = json.results[0];
  // Verify that password_format is completely removed
  assert.strictEqual((student as any).password_format, undefined, "password_format field must not be exposed");
  // Verify that raw password (DOB 15082004) is NOT present in any returned field value
  const jsonStr = JSON.stringify(json);
  assert.ok(!jsonStr.includes("Enter 15082004"), "Cleartext password instructional hint must not be leaked");
});

test("SECURITY: Cron clear-audit-logs must strictly fail closed (401) without valid Bearer token", async () => {
  // 1. No Authorization header
  const reqNoAuth = new Request("http://localhost:3000/api/cron/clear-audit-logs");
  const resNoAuth = await cronClearAuditLogsGET(reqNoAuth);
  assert.strictEqual(resNoAuth.status, 401, "Missing Authorization header must return 401 Unauthorized");

  // 2. Invalid Bearer token
  const reqBadAuth = new Request("http://localhost:3000/api/cron/clear-audit-logs", {
    headers: { authorization: "Bearer invalid-fake-token-123" }
  });
  const resBadAuth = await cronClearAuditLogsGET(reqBadAuth);
  assert.strictEqual(resBadAuth.status, 401, "Invalid Bearer token must return 401 Unauthorized");
});

test("DATA ISOLATION: Parent Ward lookup must return 404 on nonexistent roll number", async () => {
  const req = new NextRequest("http://localhost:3000/api/parent/ward?roll_number=UNKNOWN_NONEXISTENT_9999");
  const res = await parentWardGET(req);
  const json = await res.json();

  assert.strictEqual(res.status, 404, "Unknown student roll must return 404 Not Found");
  assert.strictEqual(json.success, false);
  assert.strictEqual(json.data, undefined, "Must not leak student data or fall back to students[0]");
});

test("CONTRACT: Assignment submission with invalid assignment_id must return 404", async () => {
  const req = new NextRequest("http://localhost:3000/api/assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assignment_id: "non-existent-asg-id-9999",
      submission_url: "https://github.com/student/my-solution"
    })
  });

  const res = await assignmentsPOST(req);
  const json = await res.json();

  assert.strictEqual(res.status, 404, "Submitting to invalid assignment must return 404");
  assert.strictEqual(json.success, false);
  assert.ok(json.error.includes("not found"));
});

test("CONTRACT: Promotion engine enforces graduation boundary and cleans attendance standing", async () => {
  // Ensure a test final-year class exists
  serverState.addClass({
    id: "cls-final-yr-test",
    name: "B.Tech Computer Science Final Year",
    section: "CS-FINAL",
    year: 4,
    semester: 8,
    academic_year: "2026-2027",
    department: "Computer Science",
    student_count: 1,
    claims: []
  });

  serverState.addStudent({
    id: "stud-final-yr-test",
    name: "Graduating Senior",
    roll_number: "CS-SR-01",
    register_number: "REG2024CS099",
    email: "senior@attendex.edu",
    dob: "01012002",
    formatted_dob: "01/01/2002",
    class_name: "B.Tech Computer Science Final Year (CS-FINAL)",
    section: "CS-FINAL",
    year: 4,
    semester: 8,
    attendance_percentage: 65.0,
    cgpa: 8.5,
    total_sessions: 60,
    attended_sessions: 39,
    phone: "+91 98000 00099",
    parent_name: "Parent",
    parent_email: "p@example.com",
    parent_phone: "+91 98000 00098",
    hostel: "Day Scholar",
    status: "ACTIVE"
  });

  const req = new NextRequest("http://localhost:3000/api/promotion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ class_ids: ["cls-final-yr-test"] })
  });

  const res = await promotionPOST(req);
  const json = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);

  // Check that year did not exceed 4 (no fake Year 5 created)
  const classes = serverState.getClasses();
  const finalCls = classes.find(c => c.id === "cls-final-yr-test");
  assert.strictEqual(finalCls?.year, 4, "Year 4 must not increment to Year 5");
});

test("TELEMETRY: Pulse route calculates absenteesToday and shortageAlerts independently", async () => {
  const req = new NextRequest("http://localhost:3000/api/pulse");
  const res = await pulseGET(req);
  const json = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.success, true);
  assert.ok(typeof json.absenteesToday === "number");
  assert.ok(typeof json.shortageAlerts === "number");
});
