/**
 * ATTENDEX — Exhaustive E2E Multi-Portal Pipeline Verification Script
 * 
 * Tests every endpoint individually, then executes an integrated multi-portal
 * lifecycle across Teacher, Student, Parent, and Principal.
 */

const BASE_URL = "http://localhost:3000";

interface CheckResult {
  step: string;
  endpoint: string;
  status: "PASS" | "FAIL";
  details: string;
}

const results: CheckResult[] = [];

function assert(step: string, endpoint: string, condition: boolean, details: string) {
  const status = condition ? "PASS" : "FAIL";
  results.push({ step, endpoint, status, details });
  console.log(`[${status}] ${step} (${endpoint}) — ${details}`);
  if (!condition) {
    throw new Error(`Assertion failed at ${step}: ${details}`);
  }
}

async function runPipelineAudit() {
  console.log("================================================================================");
  console.log("         ATTENDEX — FULL-STACK PIPELINE & INTEGRATION AUDIT                     ");
  console.log("================================================================================\n");

  try {
    // ──────────────────────────────────────────────────────────────────────────
    // PHASE 1: ISOLATED ENDPOINT HEALTH CHECKS
    // ──────────────────────────────────────────────────────────────────────────
    console.log(">>> PHASE 1: INDIVIDUAL ENDPOINT VERIFICATION\n");

    // 1.1 Pulse Telemetry
    const pulseRes = await fetch(`${BASE_URL}/api/pulse`);
    const pulseJson = await pulseRes.json();
    assert("Pulse Telemetry Query", "/api/pulse", pulseRes.status === 200 && pulseJson.success === true, `Active Students: ${pulseJson.totalStudents}, Attendance: ${pulseJson.overallAttendance}%`);

    // 1.2 Students Directory
    const studentsRes = await fetch(`${BASE_URL}/api/students`);
    const studentsJson = await studentsRes.json();
    assert("Students Query", "/api/students", studentsRes.status === 200 && Array.isArray(studentsJson.data), `Fetched ${studentsJson.data.length} registered students`);

    // 1.3 Classes Registry
    const classesRes = await fetch(`${BASE_URL}/api/classes`);
    const classesJson = await classesRes.json();
    assert("Classes Query", "/api/classes", classesRes.status === 200 && Array.isArray(classesJson.data), `Fetched ${classesJson.data.length} academic cohorts`);

    // 1.4 Subjects Master
    const subjectsRes = await fetch(`${BASE_URL}/api/subjects`);
    const subjectsJson = await subjectsRes.json();
    assert("Subjects Query", "/api/subjects", subjectsRes.status === 200 && Array.isArray(subjectsJson.data), `Fetched ${subjectsJson.data.length} curriculum subjects`);

    // 1.5 Timetable Master
    const ttRes = await fetch(`${BASE_URL}/api/timetable?day=Monday`);
    const ttJson = await ttRes.json();
    assert("Timetable Query", "/api/timetable", ttRes.status === 200 && Array.isArray(ttJson.data), `Retrieved ${ttJson.data.length} scheduled lectures for Monday`);

    // 1.6 Assessment Marks
    const marksRes = await fetch(`${BASE_URL}/api/marks?class_id=cls-csa&subject_id=sub-cs401`);
    const marksJson = await marksRes.json();
    assert("Marks Query", "/api/marks", marksRes.status === 200 && Array.isArray(marksJson.data), `Retrieved CIA scores for ${marksJson.data.length} students`);

    // 1.7 Audit Ledger
    const auditRes = await fetch(`${BASE_URL}/api/audit`);
    const auditJson = await auditRes.json();
    assert("Audit Logs & Anomalies", "/api/audit", auditRes.status === 200 && Array.isArray(auditJson.anomalies), `Detected ${auditJson.anomalies.length} proxy anomalies, ${auditJson.auditLogs?.length || 0} audit logs`);

    // 1.8 Coursework Assignments
    const asgRes = await fetch(`${BASE_URL}/api/assignments?roll_number=CS-11`);
    const asgJson = await asgRes.json();
    assert("Assignments Query", "/api/assignments", asgRes.status === 200 && Array.isArray(asgJson.data), `Retrieved ${asgJson.data.length} course assignments`);

    // 1.9 Sports Registry
    const sportsRes = await fetch(`${BASE_URL}/api/sports`);
    const sportsJson = await sportsRes.json();
    assert("Sports Query", "/api/sports", sportsRes.status === 200 && Array.isArray(sportsJson.data), `Retrieved ${sportsJson.data.length} sports achievements`);

    // 1.10 Parent Ward Telemetry
    const wardRes = await fetch(`${BASE_URL}/api/parent/ward?roll_number=CS-11`);
    const wardJson = await wardRes.json();
    assert("Parent Ward Telemetry", "/api/parent/ward", wardRes.status === 200 && wardJson.data?.student?.name === "Aarav Sharma", `Ward dynamically bound: ${wardJson.data?.student?.name} (${wardJson.data?.student?.roll_number})`);

    // ──────────────────────────────────────────────────────────────────────────
    // PHASE 2: CROSS-PORTAL INTEGRATED PIPELINE (SINGLE COHERENT UNIT)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("\n>>> PHASE 2: MULTI-WORKING POINTS AS A SINGLE UNIT\n");

    // Test Cohort: CS-E2E-1
    const testRoll = `E2E-${Date.now().toString().slice(-4)}`;
    const testName = `Audit Student ${testRoll}`;

    // STEP 2.1: Admin/Registrar enrolls a new student via /api/students
    const enrollRes = await fetch(`${BASE_URL}/api/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: testName,
        roll: testRoll,
        email: `${testRoll.toLowerCase()}@attendex.edu`,
        class_name: "B.Tech Computer Science (CS-A)",
        section: "CS-A",
        year: 2,
        semester: 4,
        attendance_percentage: 80.0,
        cgpa: 8.5,
        dob: "12122004",
        parent_name: "Test Guardian",
        parent_email: "guardian.test@example.com"
      })
    });
    const enrollJson = await enrollRes.json();
    assert("Student Enrollment", "/api/students", enrollJson.success === true, `Enrolled ${testName} with roll ${testRoll}`);

    // STEP 2.2: Verify Student is immediately searchable in students registry
    const verifyStRes = await fetch(`${BASE_URL}/api/students?search=${testRoll}`);
    const verifyStJson = await verifyStRes.json();
    assert("Student Immediate Propagation", "/api/students", verifyStJson.data.some((s: any) => s.roll_number === testRoll), `Verified ${testRoll} present in database search`);

    // STEP 2.3: Teacher claims subject CS405 for class CS-A
    const claimRes = await fetch(`${BASE_URL}/api/classes/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        class_id: "cls-csa",
        subject_id: "sub-cs405",
        teacher_id: "teacher-prof-arvind",
        teacher_name: "Prof. Arvind Sharma"
      })
    });
    const claimJson = await claimRes.json();
    assert("Faculty Course Allocation Lock", "/api/classes/claim", claimJson.success === true, claimJson.message);

    // STEP 2.4: Faculty submits live attendance roll-call with student present
    const rollCallRes = await fetch(`${BASE_URL}/api/attendance/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        class_id: "cls-csa",
        subject_id: "sub-cs405",
        date: new Date().toISOString().split("T")[0],
        period: 2,
        records: [
          { student_id: testRoll, status: "PRESENT" },
          { student_id: "CS-11", status: "PRESENT" },
          { student_id: "CS-23", status: "ABSENT" } // Shortage student
        ]
      })
    });
    const rollCallJson = await rollCallRes.json();
    assert("Attendance Roll-Call Ingestion", "/api/attendance/submit", rollCallJson.success === true, `Saved roll-call: ${rollCallJson.attendance_rate || 67}% attendance rate`);

    // STEP 2.5: Faculty grades CIA evaluation marks for test student
    const gradeRes = await fetch(`${BASE_URL}/api/marks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        class_id: "cls-csa",
        subject_id: "sub-cs405",
        records: [
          {
            student_id: testRoll,
            roll_number: testRoll,
            cia1: 18,
            cia2: 19,
            test1: 22,
            test2: 24,
            attendancePercentage: 85
          }
        ]
      })
    });
    const gradeJson = await gradeRes.json();
    assert("CIA Marks Submission", "/api/marks", gradeJson.success === true, `Submitted CIA marks for ${testRoll}`);

    // STEP 2.6: Verify student marks propagate to student query
    const studentMarksRes = await fetch(`${BASE_URL}/api/marks?class_id=cls-csa&subject_id=sub-cs405`);
    const studentMarksJson = await studentMarksRes.json();
    const evaluated = studentMarksJson.data.find((m: any) => m.roll_number === testRoll);
    assert("Marks Propagation to Student Query", "/api/marks", Boolean(evaluated && evaluated.final_marks > 0), `Calculated Final Score: ${evaluated?.final_marks}/20, Grade: ${evaluated?.grade}`);

    // STEP 2.7: Student submits coursework assignment
    const submitAsgRes = await fetch(`${BASE_URL}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignment_id: "asg-1",
        student_id: testRoll,
        student_name: testName,
        roll_number: testRoll,
        submission_url: "https://github.com/attendex/e2e-submission-test"
      })
    });
    const submitAsgJson = await submitAsgRes.json();
    assert("Student Assignment Dispatch", "/api/assignments", submitAsgJson.success === true, submitAsgJson.message);

    // STEP 2.8: Parent portal queries dynamic ward telemetry for test student
    const parentWardRes = await fetch(`${BASE_URL}/api/parent/ward?roll_number=${testRoll}`);
    const parentWardJson = await parentWardRes.json();
    assert("Parent Ward Multi-Portal Reflection", "/api/parent/ward", parentWardJson.data?.student?.roll_number === testRoll, `Parent correctly sees ${testName} with ${parentWardJson.data?.fees?.length} fee records`);

    // STEP 2.9: Query available slots from /api/proctor/slots
    const testSlotDate = `2026-12-${(10 + Math.floor(Math.random() * 15)).toString()}`;
    const slotsRes = await fetch(`${BASE_URL}/api/proctor/slots?date=${testSlotDate}`);
    const slotsJson = await slotsRes.json();
    const availableSlot = (slotsJson.slots || []).find((s: any) => s.status === "AVAILABLE")?.time || "02:00 PM – 02:30 PM";

    // Book proctor consultation
    const bookProctorRes = await fetch(`${BASE_URL}/api/proctor/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: testRoll,
        studentName: testName,
        rollNumber: testRoll,
        className: "B.Tech CS-A",
        proctorName: "Dr. Pavan Kulkarni",
        topic: "Academic Standing Review",
        message: "Requesting guidance on elective tracks.",
        scheduledDate: testSlotDate,
        scheduledTime: availableSlot
      })
    });
    const bookProctorJson = await bookProctorRes.json();
    assert("Proctor Consultation Booking", "/api/proctor/book", bookProctorJson.success === true, `Consultation Code: ${bookProctorJson.displayCode} (${testSlotDate} at ${availableSlot})`);

    // Verify Collision Prevention Engine strictly rejects competing double-booking
    const duplicateBookRes = await fetch(`${BASE_URL}/api/proctor/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: "competitor-student-id",
        studentName: "Competitor Student",
        rollNumber: "CS-999",
        className: "B.Tech CS-A",
        proctorName: "Dr. Pavan Kulkarni",
        topic: "Competing consultation request",
        message: "Attempting to reserve already booked slot.",
        scheduledDate: testSlotDate,
        scheduledTime: availableSlot
      })
    });
    assert("Proctor Collision Prevention", "/api/proctor/book", duplicateBookRes.status === 409, `Correctly rejected competing double-booking for slot ${availableSlot}`);

    // STEP 2.10: Student applies for gatepass
    const gatepassRes = await fetch(`${BASE_URL}/api/gatepass/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: testRoll,
        studentName: testName,
        rollNumber: testRoll,
        exitTime: "16:00",
        expectedReturn: "19:00",
        destination: "City Research Library",
        reason: "Academic project literature reference",
        emergencyContact: "+91 98450 99999"
      })
    });
    const gatepassJson = await gatepassRes.json();
    assert("Gatepass Nonce Issuance", "/api/gatepass/submit", gatepassJson.success === true, `Issued Gatepass Code: ${gatepassJson.displayCode}`);

    // STEP 2.11: Teacher/Principal reviews and approves gatepass
    const approveGpRes = await fetch(`${BASE_URL}/api/gatepass/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: gatepassJson.gatepassId,
        decision: "APPROVED",
        notes: "Approved by Head Proctor"
      })
    });
    const approveGpJson = await approveGpRes.json();
    assert("Gatepass Administrative Decision", "/api/gatepass/decide", approveGpJson.success === true, approveGpJson.message);

    // STEP 2.12: Academic Dean executes batch promotion for class CS-A
    const promoRes = await fetch(`${BASE_URL}/api/promotion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        class_ids: ["cls-csa"]
      })
    });
    const promoJson = await promoRes.json();
    assert("Batch Promotion Pipeline", "/api/promotion", promoJson.success === true, promoJson.message);

    // STEP 2.13: Pulse Telemetry reflects live updates across the whole system
    const finalPulseRes = await fetch(`${BASE_URL}/api/pulse`);
    const finalPulseJson = await finalPulseRes.json();
    assert("Dynamic System Pulse Synchronization", "/api/pulse", finalPulseJson.totalStudents >= 16, `Total Enrolled: ${finalPulseJson.totalStudents}, Campus Average: ${finalPulseJson.overallAttendance}%, Recent Events: ${finalPulseJson.recentActivity?.length}`);

    // Print Final Scorecard
    console.log("\n================================================================================");
    console.log("             PIPELINE AUDIT SUMMARY & SYSTEM HEALTH SCORECARD                   ");
    console.log("================================================================================");
    console.table(results);

    const passedCount = results.filter(r => r.status === "PASS").length;
    console.log(`\nTOTAL VERIFIED PIPELINES: ${results.length}`);
    console.log(`✅ PASSED: ${passedCount} / ${results.length} (100%)`);
    console.log("ALL MODULES AND PACKAGES FULLY OPERATIONAL AS A SINGLE INTEGRATED UNIT.\n");
  } catch (err: any) {
    console.error("Pipeline verification encountered an error:", err.message);
    process.exit(1);
  }
}

runPipelineAudit();
