import { test } from "node:test";
import assert from "node:assert/strict";
import { serverState } from "./server-state";
import { universalWorkflow } from "./workflow-engine";
import { calculateAttendanceMetrics, calculateSubjectGrade, calculateSGPA } from "./calculations";
import { checkSlotCollision } from "./proctor-slots";

test("INTEGRATED PIPELINE 1: Individual Endpoints Health & State Querying", async () => {
  const students = serverState.getStudents();
  assert.ok(students.length >= 16, "Must have at least 16 registered institutional students");

  const classes = serverState.getClasses();
  assert.ok(classes.length >= 5, "Must have at least 5 academic batches");

  const subjects = serverState.getSubjects();
  assert.ok(subjects.length >= 8, "Must have at least 8 curriculum subjects");

  const assignments = serverState.getAssignments();
  assert.ok(assignments.length >= 3, "Must have active coursework assignments");

  const sports = serverState.getSports();
  assert.ok(sports.length >= 4, "Must have recorded sports events");

  const auditLogs = serverState.getAuditLogs();
  assert.ok(auditLogs.length >= 3, "Must retain audit trail");
});

test("INTEGRATED PIPELINE 2: Multi-Portal Working Points as a Single Unit", async () => {
  const testRoll = `PIPE-${Date.now().toString().slice(-4)}`;
  const testName = `Integration Unit ${testRoll}`;

  // 1. Enrollment propagates to database state
  serverState.addStudent({
    id: `stud-${testRoll}`,
    name: testName,
    roll_number: testRoll,
    register_number: `REG2024${testRoll}`,
    email: `${testRoll.toLowerCase()}@attendex.edu`,
    dob: "14082004",
    formatted_dob: "14/08/2004",
    class_name: "B.Tech Computer Science (CS-A)",
    section: "CS-A",
    year: 2,
    semester: 4,
    attendance_percentage: 82.0,
    cgpa: 8.4,
    total_sessions: 60,
    attended_sessions: 49,
    phone: "+91 98450 77777",
    parent_name: "Integration Guardian",
    parent_email: "guardian@test.edu",
    parent_phone: "+91 98450 88888",
    hostel: "Day Scholar",
    status: "ACTIVE"
  });

  const studentVerify = serverState.getStudents().find(s => s.roll_number === testRoll);
  assert.ok(studentVerify, "Enrolled student must exist in server state");
  assert.equal(studentVerify.name, testName);

  // 2. Faculty allocates subject to class
  serverState.claimSubject("cls-csa", "sub-cs404", "teacher-101", "Prof. Arvind Sharma");
  const classVerify = serverState.getClasses().find(c => c.id === "cls-csa");
  const claimVerify = classVerify?.claims.find(cl => cl.subject_id === "sub-cs404");
  assert.ok(claimVerify, "Subject claim must be locked in class portfolio");

  // 3. Faculty conducts roll-call and logs attendance
  serverState.addAttendanceSession({
    id: `att-sess-${Date.now()}`,
    class_id: "cls-csa",
    subject_id: "sub-cs404",
    teacher_id: "teacher-101",
    date: new Date().toISOString().split("T")[0],
    period: 3,
    academic_year: "2026-2027",
    records: [
      { student_id: testRoll, status: "PRESENT" },
      { student_id: "CS-11", status: "PRESENT" }
    ],
    created_at: new Date().toISOString()
  });

  // Student percentage dynamically recalculated
  const updatedStudent = serverState.getStudents().find(s => s.roll_number === testRoll);
  assert.ok(updatedStudent && updatedStudent.total_sessions > 60, "Total sessions must increment");

  // 4. Faculty grades Continuous Assessment (CIA) marks
  serverState.saveMarks([
    {
      id: `mk-${Date.now()}`,
      student_id: testRoll,
      subject_id: "sub-cs404",
      class_id: "cls-csa",
      cia1: 19,
      cia2: 20,
      test1: 23,
      test2: 24,
      attendance_score: 5,
      final_marks: 18.5,
      grade: "O",
      updated_at: new Date().toISOString()
    }
  ]);

  const marksVerify = serverState.getMarks("cls-csa", "sub-cs404");
  const studentMark = marksVerify.find(m => m.student_id === testRoll);
  assert.ok(studentMark, "Marks must propagate to query");
  assert.equal(studentMark.grade, "O");

  // 5. Student submits coursework
  serverState.addAssignmentSubmission("asg-1", {
    student_id: testRoll,
    student_name: testName,
    roll_number: testRoll,
    submission_url: "https://github.com/attendex/unit-test-submission",
    submitted_at: new Date().toISOString(),
    status: "Submitted",
    score: "Pending Faculty Evaluation"
  });

  const asgVerify = serverState.getAssignments().find(a => a.id === "asg-1");
  const submission = asgVerify?.submissions.find(s => s.roll_number === testRoll);
  assert.ok(submission, "Assignment submission must be recorded");

  // 6. Cross-portal workflow: Leave request submission and decision
  const leaveRes = await universalWorkflow.submitLeave({
    studentId: testRoll,
    studentName: testName,
    rollNumber: testRoll,
    className: "B.Tech Computer Science (CS-A)",
    leaveType: "MEDICAL",
    startDate: "2026-11-10",
    endDate: "2026-11-12",
    reason: "Severe viral fever diagnosed by physician"
  });
  assert.ok(leaveRes.success, "Leave request must be created");

  const approveRes = await universalWorkflow.decideLeave(leaveRes.leaveId!, "APPROVED", "Approved by HOD & Principal");
  assert.ok(approveRes.success, "Leave request must transition to APPROVED");

  // 7. Proctor zero-collision booking
  const uniqueDate = `2026-12-${(10 + Math.floor(Math.random() * 18)).toString()}`;
  serverState.addProctorRequest({
    id: `pr-test-${Date.now()}`,
    displayCode: "PR-TEST",
    studentId: testRoll,
    studentName: testName,
    rollNumber: testRoll,
    className: "B.Tech CS-A",
    proctorName: "Dr. Pavan Kulkarni",
    topic: "Career Mentorship",
    message: "Elective track review",
    scheduledDate: uniqueDate,
    scheduledTime: "10:00 AM – 10:30 AM",
    status: "SCHEDULED",
    createdAt: new Date().toISOString()
  });

  const collision = checkSlotCollision(uniqueDate, "10:00 AM – 10:30 AM");
  assert.equal(collision.collides, true, "Collision engine must detect and prevent double-booking");
});
