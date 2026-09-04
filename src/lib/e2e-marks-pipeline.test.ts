import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST as submitMarks } from "@/app/api/marks/submit/route";
import { calculateSubjectGrade, calculateSGPA } from "@/lib/calculations";

test("MARKS PIPELINE: Test 1 - Teacher Submits Continuous Assessment Marks", async () => {
  const payload = {
    classId: "00000000-0000-0000-0000-000000000020",
    subjectId: "00000000-0000-0000-0000-000000000040",
    assessmentName: "Continuous Internal Assessment (CIA-1)",
    maxMarks: 40,
    weightage: 20,
    records: [
      { studentId: "00000000-0000-0000-0000-000000000030", marksObtained: 38 },
      { studentId: "00000000-0000-0000-0000-000000000031", marksObtained: 34 }
    ]
  };

  const req = new NextRequest("http://localhost:3000/api/marks/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const res = await submitMarks(req);
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.ok(json.componentId, "Expected componentId in response");
});

test("MARKS PIPELINE: Test 2 - Normalization and Grade Boundary Mapping", () => {
  const resultO = calculateSubjectGrade({
    cia1: 24,
    cia2: 24,
    test1: 38,
    test2: 38,
    assignment: 10,
    credits: 4
  });
  assert.equal(resultO.grade, "O");
  assert.equal(resultO.gradePoints, 10);

  const resultA = calculateSubjectGrade({
    cia1: 18,
    cia2: 18,
    test1: 28,
    test2: 28,
    assignment: 8,
    credits: 4
  });
  assert.equal(resultA.grade, "A");
  assert.equal(resultA.gradePoints, 8);
});

test("MARKS PIPELINE: Test 3 - Semester SGPA Aggregate Calculation", () => {
  const courseGrades = [
    { totalScore: 92, normalizedPercentage: 92, grade: "O", gradePoints: 10, credits: 4, passed: true },
    { totalScore: 84, normalizedPercentage: 84, grade: "A+", gradePoints: 9, credits: 4, passed: true },
    { totalScore: 82, normalizedPercentage: 82, grade: "A+", gradePoints: 9, credits: 3, passed: true },
    { totalScore: 74, normalizedPercentage: 74, grade: "A", gradePoints: 8, credits: 3, passed: true },
    { totalScore: 95, normalizedPercentage: 95, grade: "O", gradePoints: 10, credits: 2, passed: true },
    { totalScore: 96, normalizedPercentage: 96, grade: "O", gradePoints: 10, credits: 2, passed: true },
  ];
  const summary = calculateSGPA(courseGrades);
  assert.equal(summary.sgpa, 9.28);
  assert.equal(summary.totalCredits, 18);
  assert.equal(summary.passedCredits, 18);
});
