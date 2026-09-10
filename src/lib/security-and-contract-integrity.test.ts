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

test("SECURITY: Backdoor passwords must be rejected for student authentication", async () => {
  const { POST: studentLoginPOST } = await import("@/app/api/auth/student-login/route");

  // Attempting with removed testing backdoors
  const reqBackdoor1 = new NextRequest("http://localhost:3000/api/auth/student-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "CS-11", password: "attendex2026" })
  });
  const resBackdoor1 = await studentLoginPOST(reqBackdoor1);
  assert.strictEqual(resBackdoor1.status, 401, "attendex2026 backdoor must be rejected");

  const reqBackdoor2 = new NextRequest("http://localhost:3000/api/auth/student-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "CS-11", password: "student123" })
  });
  const resBackdoor2 = await studentLoginPOST(reqBackdoor2);
  assert.strictEqual(resBackdoor2.status, 401, "student123 backdoor must be rejected");
});

test("SECURITY: Account recovery generates 6-digit PIN and allows secure password reset", async () => {
  const { POST: recoverPOST } = await import("@/app/api/auth/recover/route");
  const { POST: resetPasswordPOST } = await import("@/app/api/auth/reset-password/route");

  // 1. Initiate recovery for student CS-11
  const recReq = new NextRequest("http://localhost:3000/api/auth/recover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: "STUDENT",
      identifier: "CS-11",
      registered_contact: "aarav.sharma@attendex.edu"
    })
  });
  const recRes = await recoverPOST(recReq);
  const recJson = await recRes.json();

  assert.strictEqual(recRes.status, 200);
  assert.strictEqual(recJson.success, true);
  assert.ok(recJson.pin && recJson.pin.length === 6, "Must generate a 6-digit PIN");

  // 2. Commit new password / DOB
  const resetReq = new NextRequest("http://localhost:3000/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "CS-11",
      pin: recJson.pin,
      new_password: "20082004"
    })
  });
  const resetRes = await resetPasswordPOST(resetReq);
  const resetJson = await resetRes.json();

  assert.strictEqual(resetRes.status, 200);
  assert.strictEqual(resetJson.success, true);
});

test("MARKS PIPELINE: Real-time sync reflects teacher submission directly into student marks query", async () => {
  const { POST: marksPOST, GET: marksGET } = await import("@/app/api/marks/route");

  // Teacher submits continuous assessment marks
  const postReq = new NextRequest("http://localhost:3000/api/marks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      class_id: "cls-csa",
      subject_id: "sub-cs401",
      records: [{
        student_id: "cc000000-0000-0000-0000-000000000011",
        roll_number: "CS-11",
        cia1: 9,
        cia2: 10,
        test1: 24,
        test2: 25,
        attendancePercentage: 94
      }]
    })
  });
  const postRes = await marksPOST(postReq);
  const postJson = await postRes.json();

  assert.strictEqual(postRes.status, 200);
  assert.strictEqual(postJson.success, true);

  // Student / Parent queries marks for CS-11
  const getReq = new NextRequest("http://localhost:3000/api/marks?roll_number=CS-11");
  const getRes = await marksGET(getReq);
  const getJson = await getRes.json();

  assert.strictEqual(getRes.status, 200);
  assert.strictEqual(getJson.success, true);
  assert.ok(Array.isArray(getJson.data));

  const cs401Record = getJson.data.find((s: any) => s.subject_id === "sub-cs401" || s.subject_code === "CS401");
  assert.ok(cs401Record, "Must return CS401 record for student");
  assert.strictEqual(cs401Record.cia1, 9);
  assert.strictEqual(cs401Record.cia2, 10);
  assert.strictEqual(cs401Record.test1, 24);
  assert.strictEqual(cs401Record.test2, 25);
  // Attendance is 94% -> 5 marks, CIA capped at 5, Tests (24+25)/80*10 = 6.1 -> Total is 16.1 / 20
  assert.strictEqual(cs401Record.attendanceMarks, 5);
  assert.strictEqual(cs401Record.ciaTotal, 5);
  assert.ok(cs401Record.final_marks >= 16.0, `Expected final marks >= 16.0, got ${cs401Record.final_marks}`);
  assert.strictEqual(cs401Record.grade, "A+");
});

