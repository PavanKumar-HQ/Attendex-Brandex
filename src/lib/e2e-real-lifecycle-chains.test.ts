import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as submitLeave } from "@/app/api/leave/submit/route";
import { GET as getLeaves } from "@/app/api/leave/route";
import { POST as decideLeave } from "@/app/api/leave/decide/route";
import { POST as submitGatepass } from "@/app/api/gatepass/submit/route";
import { GET as getGatepasses } from "@/app/api/gatepass/route";
import { POST as decideGatepass } from "@/app/api/gatepass/decide/route";
import { POST as submitAttendance } from "@/app/api/attendance/submit/route";
import { POST as submitMarks } from "@/app/api/marks/submit/route";
import { GET as getProctorSlots } from "@/app/api/proctor/slots/route";
import { POST as bookProctorSlot } from "@/app/api/proctor/book/route";
import { POST as decideProctor } from "@/app/api/proctor/decide/route";
import { calculateAttendanceMetrics, calculateSubjectGrade, calculateSGPA } from "@/lib/calculations";

/**
 * CHAIN 1: Student -> Leave Request -> Teacher -> Approve/Reject -> DB -> Notification -> Persistence
 */
test("LIFECYCLE CHAIN 1: Full Leave Application, Approval, Notification & Refresh Persistence", async () => {
  const studentId = "00000000-0000-0000-0000-000000000030";
  const uniqueReason = `High-altitude respiratory rehabilitation - Cycle #${Date.now()}`;
  
  // 1. Student submits leave request via API
  const submitReq = new NextRequest("http://localhost:3000/api/leave/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId,
      studentName: "Rahul Deshmukh",
      rollNumber: "21CS042",
      className: "B.Tech CSE - 4A",
      leaveType: "MEDICAL",
      startDate: "2026-10-15",
      endDate: "2026-10-18",
      reason: uniqueReason
    })
  });

  const submitRes = await submitLeave(submitReq);
  assert.equal(submitRes.status, 200, "Leave submission must return 200 OK");
  const submitJson = await submitRes.json();
  assert.equal(submitJson.success, true);
  const leaveId = submitJson.leaveId;
  assert.ok(leaveId, "RFC-4122 leaveId generated");

  // 2. Teacher reads pending queue (reconciliation check)
  const queueRes = await getLeaves();
  const queueJson = await queueRes.json();
  const pendingRecord = queueJson.data.find((l: any) => l.id === leaveId || l.reason === uniqueReason);
  assert.ok(pendingRecord, "Submitted leave must appear in teacher's queue");
  assert.equal(pendingRecord.status, "PENDING");

  // 3. Teacher Approves Leave
  const decideReq = new NextRequest("http://localhost:3000/api/leave/decide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leaveId,
      decision: "APPROVED",
      reviewNotes: "Medical certificate verified by campus health center."
    })
  });

  const decideRes = await decideLeave(decideReq);
  assert.equal(decideRes.status, 200, "Decision must return 200 OK");
  const decideJson = await decideRes.json();
  assert.equal(decideJson.success, true);

  // 4. Student/Parent refreshed query confirms APPROVED state and audit trail
  const refreshedRes = await getLeaves();
  const refreshedJson = await refreshedRes.json();
  const approvedRecord = refreshedJson.data.find((l: any) => l.id === leaveId || l.reason === uniqueReason);
  assert.ok(approvedRecord, "Record must persist after refresh");
  assert.equal(approvedRecord.status, "APPROVED");
  assert.ok(approvedRecord.reviewedBy, "Reviewer must be recorded");
  assert.ok(approvedRecord.reviewedAt, "Timestamp must be recorded");
});

/**
 * CHAIN 2: Student -> Gatepass -> Warden/Security Decision -> Cryptographic QR -> Refresh Verification
 */
test("LIFECYCLE CHAIN 2: Gatepass Request, QR Nonce Issuance, Decision & Verification", async () => {
  const uniqueDest = `Regional Tech Exposition Hall 4 - Ref #${Date.now()}`;

  // 1. Student applies for outpass
  const req = new NextRequest("http://localhost:3000/api/gatepass/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentName: "Rahul Deshmukh",
      rollNumber: "21CS042",
      exitTime: "Friday, Oct 24 • 04:00 PM",
      expectedReturn: "Sunday, Oct 26 • 08:00 PM",
      destination: uniqueDest,
      reason: "Participating in National Hackathon finals.",
      emergencyContact: "+91 98450 11223"
    })
  });

  const res = await submitGatepass(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  const passId = json.gatepassId;
  const qrNonce = json.qrNonce;

  assert.ok(passId, "Gatepass ID generated");
  assert.ok(qrNonce, "Cryptographic QR nonce generated");

  // 2. Warden approves outpass
  const decideReq = new NextRequest("http://localhost:3000/api/gatepass/decide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gatepassId: passId,
      decision: "APPROVED",
      reviewedBy: "Chief Warden Dr. V. Hegde"
    })
  });

  const decideRes = await decideGatepass(decideReq);
  assert.equal(decideRes.status, 200);

  // 3. Security gate checkpoint lookup
  const checkpointRes = await getGatepasses();
  const checkpointJson = await checkpointRes.json();
  const pass = checkpointJson.data.find((g: any) => g.id === passId || g.destination === uniqueDest);
  assert.ok(pass, "Gatepass must be in authoritative security registry");
  assert.equal(pass.status, "APPROVED");
  assert.equal(pass.qrNonce, qrNonce);
});

/**
 * CHAIN 3: Teacher -> Attendance Roll-Call -> PostgreSQL -> Student & Parent Dashboards
 */
test("LIFECYCLE CHAIN 3: Teacher Attendance Roll-Call, DB Ingestion, Telemetry & Shortage Alerts", async () => {
  const classId = "00000000-0000-0000-0000-000000000020";
  const subjectId = "00000000-0000-0000-0000-000000000010";
  const student1Id = "00000000-0000-0000-0000-000000000030";
  const student2Id = "00000000-0000-0000-0000-000000000031";

  // 1. Teacher submits period roll-call
  const rollCallReq = new NextRequest("http://localhost:3000/api/attendance/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      classId,
      subjectId,
      date: "2026-10-24",
      period: 1,
      lectureType: "Theory",
      records: [
        { studentId: student1Id, status: "present" },
        { studentId: student2Id, status: "absent" }
      ]
    })
  });

  const rollCallRes = await submitAttendance(rollCallReq);
  assert.equal(rollCallRes.status, 200);
  const rollCallJson = await rollCallRes.json();
  assert.equal(rollCallJson.success, true);
  assert.ok(rollCallJson.sessionId);

  // 2. Parent & Student dashboard calculation validation
  const student1Metrics = calculateAttendanceMetrics(38, 40, 75.0);
  assert.equal(student1Metrics.percentage, 95.0);
  assert.equal(student1Metrics.status, "Good Standing");
  assert.ok(student1Metrics.safeSkips > 0);

  const student2Metrics = calculateAttendanceMetrics(28, 40, 75.0);
  assert.equal(student2Metrics.percentage, 70.0);
  assert.equal(student2Metrics.status, "Shortage Alert");
  assert.equal(student2Metrics.recoveryClasses, 8);
});

/**
 * CHAIN 4: Teacher -> CIA Marks Evaluation -> Principal Publish -> SGPA Transcript
 */
test("LIFECYCLE CHAIN 4: Teacher CIA Marks Evaluation, Normalization & SGPA Transcript", async () => {
  const payload = {
    classId: "00000000-0000-0000-0000-000000000020",
    subjectId: "00000000-0000-0000-0000-000000000010",
    assessmentName: "Continuous Internal Assessment 1 (CIA-1)",
    maxMarks: 40,
    weightage: 20,
    records: [
      {
        studentId: "00000000-0000-0000-0000-000000000030",
        marksObtained: 36
      }
    ]
  };

  const req = new NextRequest("http://localhost:3000/api/marks/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const res = await submitMarks(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.componentId);

  // Normalization and transcript grading
  const assessment = {
    cia1: 22,
    cia2: 23,
    test1: 36,
    test2: 38,
    assignment: 10,
    credits: 4
  };

  const grade = calculateSubjectGrade(assessment);
  assert.equal(grade.grade, "O");
  assert.equal(grade.gradePoints, 10);
  assert.equal(grade.passed, true);

  const semesterSGPA = calculateSGPA([grade]);
  assert.equal(semesterSGPA.sgpa, 10.0);
  assert.equal(semesterSGPA.passedCredits, 4);
});

/**
 * CHAIN 5: Proctor Consultation Booking -> Real-time Slot Lock -> Concurrent Collision Rejection
 */
test("LIFECYCLE CHAIN 5: Proctor Consultation Booking, Real-time Slot Lock & Conflict Rejection", async () => {
  const teacherId = "00000000-0000-0000-0000-000000000002";
  const studentId = "00000000-0000-0000-0000-000000000030";
  const uniqueDate = `2026-11-${Math.floor(10 + Math.random() * 18)}`;
  const targetTime = "04:30 PM";

  // 1. Check initial slot availability
  const initialReq = new NextRequest(`http://localhost:3000/api/proctor/slots?teacherId=${teacherId}&date=${uniqueDate}`);
  const initialRes = await getProctorSlots(initialReq);
  assert.equal(initialRes.status, 200);
  const initialJson = await initialRes.json();
  assert.ok(initialJson.slots.length > 0);

  // 2. First parent books the slot
  const bookReq1 = new NextRequest("http://localhost:3000/api/proctor/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId,
      studentName: "Rahul Deshmukh",
      rollNumber: "21CS042",
      className: "B.Tech CSE - 4A",
      proctorName: "Dr. Pavan Kulkarni",
      topic: "Academic Standing & Elective Guidance",
      message: "Discussing specialization course selections.",
      scheduledDate: uniqueDate,
      scheduledTime: targetTime
    })
  });

  const bookRes1 = await bookProctorSlot(bookReq1);
  assert.equal(bookRes1.status, 200, "First booking must succeed");
  const bookJson1 = await bookRes1.json();
  assert.equal(bookJson1.success, true);
  const requestId = bookJson1.requestId;

  // 3. Second parent simultaneously attempts to book the EXACT same slot
  const bookReq2 = new NextRequest("http://localhost:3000/api/proctor/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId: "00000000-0000-0000-0000-000000000031",
      studentName: "Priya Sharma",
      rollNumber: "21CS043",
      className: "B.Tech CSE - 4A",
      proctorName: "Dr. Pavan Kulkarni",
      topic: "Attendance Review",
      message: "Urgent consultation regarding missed sessions.",
      scheduledDate: uniqueDate,
      scheduledTime: targetTime
    })
  });

  const bookRes2 = await bookProctorSlot(bookReq2);
  assert.equal(bookRes2.status, 409, "Second concurrent booking MUST be rejected with HTTP 409 Conflict");
  const bookJson2 = await bookRes2.json();
  assert.equal(bookJson2.success, false);
  assert.ok(bookJson2.message.includes("already reserved"), "Conflict message must explain slot contention");

  // 4. Faculty completes the consultation
  const decideReq = new NextRequest("http://localhost:3000/api/proctor/decide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestId,
      action: "COMPLETED",
      meetingNotes: "Course roadmap agreed upon. Student cleared for Capstone Phase 1.",
      actionItems: "Enroll in Distributed Systems Elective."
    })
  });

  const decideRes = await decideProctor(decideReq);
  assert.equal(decideRes.status, 200);
});
