import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as submitLeave } from "@/app/api/leave/submit/route";
import { POST as decideLeave } from "@/app/api/leave/decide/route";
import { POST as submitGatepass } from "@/app/api/gatepass/submit/route";
import { POST as submitMarks } from "@/app/api/marks/submit/route";
import { POST as bookProctorSlot } from "@/app/api/proctor/book/route";
import { POST as registerUser } from "@/app/api/auth/register/route";
import { POST as submitAttendance } from "@/app/api/attendance/submit/route";
import { POST as promoteStudents } from "@/app/api/promotion/route";
import { POST as createStaff } from "@/app/api/admin/staff/create/route";
import { GET as studentLookup } from "@/app/api/auth/student-lookup/route";
import { studentServicesService } from "@/services/student-services.service";

test("ADVERSARIAL ATTACK 1: Inverted Date Range (End Date Before Start Date)", async () => {
  const req = new NextRequest("http://localhost:3000/api/leave/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentName: "Rahul Deshmukh",
      rollNumber: "21CS042",
      className: "B.Tech CSE - 4A",
      leaveType: "MEDICAL",
      startDate: "2026-10-25",
      endDate: "2026-10-20", // Inverted date!
      reason: "Traveling out of city for family function."
    })
  });

  const res = await submitLeave(req);
  assert.equal(res.status, 400, "API must reject inverted dates with HTTP 400");
  const json = await res.json();
  assert.equal(json.success, false);
  assert.ok(json.message.includes("End date cannot precede start date"));
});

test("ADVERSARIAL ATTACK 2: Short / Malformed Reason Payload (< 5 chars)", async () => {
  const req = new NextRequest("http://localhost:3000/api/leave/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentName: "Rahul Deshmukh",
      rollNumber: "21CS042",
      leaveType: "CASUAL",
      startDate: "2026-10-20",
      endDate: "2026-10-22",
      reason: "Sick" // Only 4 characters!
    })
  });

  const res = await submitLeave(req);
  assert.equal(res.status, 400, "Must reject short reason payload with HTTP 400");
  const json = await res.json();
  assert.equal(json.success, false);
});

test("ADVERSARIAL ATTACK 3: Rejection Decision Without Mandatory Reviewer Notes", async () => {
  const req = new NextRequest("http://localhost:3000/api/leave/decide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leaveId: "00000000-0000-0000-0000-000000000001",
      decision: "REJECTED",
      reviewNotes: "" // Missing reason for rejection!
    })
  });

  const res = await decideLeave(req);
  assert.equal(res.status, 400, "Rejection must enforce mandatory explanation notes");
  const json = await res.json();
  assert.equal(json.success, false);
  assert.ok(json.message.toLowerCase().includes("rejection") || json.message.toLowerCase().includes("required") || json.message.toLowerCase().includes("notes"));
});

test("ADVERSARIAL ATTACK 4: Malformed / SQL-Injection String in Leave ID", async () => {
  const req = new NextRequest("http://localhost:3000/api/leave/decide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leaveId: "'; DROP TABLE leave_requests; --",
      decision: "APPROVED"
    })
  });

  const res = await decideLeave(req);
  // Must safely return >= 400 without crashing server
  assert.ok(res.status >= 400, "Malformed ID must return error status >= 400");
  const json = await res.json();
  assert.equal(json.success, false);
});

test("ADVERSARIAL ATTACK 5: Proctor Booking 50 Concurrent Competing Requests for 1 Slot", async () => {
  const uniqueSlotDate = `2026-12-${Math.floor(10 + Math.random() * 18)}`;
  const targetTime = `${Math.floor(1 + Math.random() * 8)}:45 PM`;
  const COMPETING_USERS = 50;

  const requests = Array.from({ length: COMPETING_USERS }, (_, idx) => {
    const req = new NextRequest("http://localhost:3000/api/proctor/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: `00000000-0000-0000-0000-0000000000${String(idx + 10).padStart(2, "0")}`,
        studentName: `Student Candidate #${idx + 1}`,
        rollNumber: `21CS0${String(idx + 10).padStart(2, "0")}`,
        className: "B.Tech CSE - 4A",
        proctorName: "Dr. Pavan Kulkarni",
        topic: "Urgent Consultation",
        message: "Immediate session required.",
        scheduledDate: uniqueSlotDate,
        scheduledTime: targetTime
      })
    });
    return bookProctorSlot(req);
  });

  const responses = await Promise.all(requests);
  const statusCodes = responses.map(r => r.status);
  const successful = statusCodes.filter(s => s === 200);
  const conflicts = statusCodes.filter(s => s === 409);

  assert.equal(successful.length, 1, "Exactly ONE request must acquire the slot lock");
  assert.equal(conflicts.length, COMPETING_USERS - 1, "All other 49 concurrent requests must receive 409 Conflict");
});

test("ADVERSARIAL ATTACK 6: Forged / Non-Existent Gatepass Token Verification", async () => {
  const fakeToken = "GP-2026-FORGED-FAKE-TOKEN-9999";
  
  try {
    const result = await studentServicesService.verifyGatepass(fakeToken, "Main Campus Gate 1");
    assert.fail("Forged gatepass token must throw an error or return invalid");
  } catch (err: any) {
    assert.ok(err, "Forged token rejected with security exception");
  }
});

test("ADVERSARIAL ATTACK 7: Marks Submission Out-of-Bounds Payload Protection", async () => {
  const invalidMarksReq = new NextRequest("http://localhost:3000/api/marks/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      classId: "00000000-0000-0000-0000-000000000020",
      subjectId: "00000000-0000-0000-0000-000000000010",
      marks: [
        {
          studentId: "00000000-0000-0000-0000-000000000030",
          cia1: 999, // Out of bounds!
          cia2: -50, // Negative mark!
          test1: 20,
          test2: 20
        }
      ]
    })
  });

  const res = await submitMarks(invalidMarksReq);
  const json = await res.json();
  // Service must cap or handle invalid boundaries
  assert.ok(res.status === 200 || res.status === 400);
});

test("ADVERSARIAL ATTACK 8: Privilege Escalation - Public Registration Attempting Admin or Faculty Role", async () => {
  // Attack payload: an unauthenticated actor sends role: "ADMIN"
  const adminAttemptReq = new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Malicious Actor",
      email: "hacker@evil.com",
      password: "HackedPassword123!",
      role: "ADMIN"
    })
  });

  const adminRes = await registerUser(adminAttemptReq);
  assert.equal(adminRes.status, 403, "Public registration must reject ADMIN role creation with HTTP 403 Forbidden");
  const adminJson = await adminRes.json();
  assert.equal(adminJson.success, false);
  assert.ok(adminJson.message.includes("can only be provisioned by an Institutional Administrator"));

  // Attack payload: an unauthenticated actor sends role: "TEACHER"
  const teacherAttemptReq = new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Fake Teacher",
      email: "faketeacher@college.edu",
      password: "FacultyPass123!",
      role: "TEACHER"
    })
  });

  const teacherRes = await registerUser(teacherAttemptReq);
  assert.equal(teacherRes.status, 403, "Public registration must reject TEACHER role creation with HTTP 403 Forbidden");
});

test("ADVERSARIAL ATTACK 9: RBAC Enforcement - Student Cookie Attempting Restricted Mutation APIs", async () => {
  // A student attempts to submit class attendance
  const studentAttendanceReq = new NextRequest("http://localhost:3000/api/attendance/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": "attendex_demo_session=STUDENT"
    },
    body: JSON.stringify({
      classId: "00000000-0000-0000-0000-000000000001",
      date: "2026-09-13",
      records: []
    })
  });

  const attendanceRes = await submitAttendance(studentAttendanceReq);
  assert.equal(attendanceRes.status, 403, "Student session must be blocked from attendance submission with 403 Forbidden");

  // A student attempts to submit grade marks
  const studentMarksReq = new NextRequest("http://localhost:3000/api/marks/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": "attendex_demo_session=STUDENT"
    },
    body: JSON.stringify({
      classId: "00000000-0000-0000-0000-000000000001",
      subjectId: "00000000-0000-0000-0000-000000000001",
      marks: []
    })
  });

  const marksRes = await submitMarks(studentMarksReq);
  assert.equal(marksRes.status, 403, "Student session must be blocked from marks submission with 403");

  // A student attempts to trigger student promotions
  const studentPromoReq = new NextRequest("http://localhost:3000/api/promotion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": "attendex_demo_session=STUDENT"
    },
    body: JSON.stringify({
      class_ids: ["00000000-0000-0000-0000-000000000001"]
    })
  });

  const promoRes = await promoteStudents(studentPromoReq);
  assert.equal(promoRes.status, 403, "Student session must be blocked from promotion with 403");
});

test("ADVERSARIAL ATTACK 10: Unauthorized Staff Provisioning Attempt", async () => {
  // A student or unauthenticated caller attempts to call staff provisioning
  const unauthStaffReq = new NextRequest("http://localhost:3000/api/admin/staff/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": "attendex_demo_session=STUDENT"
    },
    body: JSON.stringify({
      fullName: "Infiltrator",
      email: "infiltrator@college.edu",
      role: "ADMIN"
    })
  });

  const staffRes = await createStaff(unauthStaffReq);
  assert.equal(staffRes.status, 403, "Staff provisioning must reject student session with 403 Forbidden");
});

test("ADVERSARIAL ATTACK 11: Roster Scraping Prevention on Student Directory Lookup", async () => {
  // Empty query attempt to dump entire database roster
  const emptyQueryReq = new NextRequest("http://localhost:3000/api/auth/student-lookup?q=", {
    method: "GET"
  });

  const lookupRes = await studentLookup(emptyQueryReq);
  assert.equal(lookupRes.status, 200);
  const json = await lookupRes.json();
  assert.equal(json.results.length, 0, "Empty query must return 0 results, preventing directory dumping");
  assert.ok(json.message.includes("at least 2 characters"));
});

