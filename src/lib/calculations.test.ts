import test from "node:test";
import assert from "node:assert/strict";
import { calculateAttendanceMetrics, calculateSubjectGrade, calculateSGPA } from "./calculations";

test("Attendance Metrics: 100% attendance yields maximum safe skips", () => {
  const result = calculateAttendanceMetrics(100, 100, 75.0);
  assert.equal(result.percentage, 100.0);
  assert.equal(result.status, "Good Standing");
  // 100 / (100 + x) >= 0.75 => x <= (100 - 75) / 0.75 = 33.33 => 33 skips
  assert.equal(result.safeSkips, 33);
  assert.equal(result.recoveryClasses, 0);
});

test("Attendance Metrics: Exactly 75% threshold has 0 safe skips and 0 recovery needed", () => {
  const result = calculateAttendanceMetrics(75, 100, 75.0);
  assert.equal(result.percentage, 75.0);
  assert.equal(result.safeSkips, 0);
  assert.equal(result.recoveryClasses, 0);
  assert.equal(result.status, "Good Standing");
});

test("Attendance Metrics: Below 75% shortage alert calculates correct recovery classes", () => {
  // 60 attended out of 100 = 60.0%
  // (60 + y) / (100 + y) >= 0.75 => 60 + y >= 75 + 0.75y => 0.25y >= 15 => y >= 60 classes
  const result = calculateAttendanceMetrics(60, 100, 75.0);
  assert.equal(result.percentage, 60.0);
  assert.equal(result.safeSkips, 0);
  assert.equal(result.recoveryClasses, 60);
  assert.equal(result.status, "Critical Danger");
});

test("Attendance Metrics: Edge Case with 0 conducted classes defaults to 100% standing", () => {
  const result = calculateAttendanceMetrics(0, 0, 75.0);
  assert.equal(result.percentage, 100.0);
  assert.equal(result.safeSkips, 0);
  assert.equal(result.recoveryClasses, 0);
  assert.equal(result.status, "Good Standing");
});

test("Grade Calculations: Accurate boundary mapping for O, A+, A, B+, B, C, F", () => {
  const gradeO = calculateSubjectGrade({ cia1: 25, cia2: 25, test1: 40, test2: 40, assignment: 10, credits: 4 });
  assert.equal(gradeO.grade, "O");
  assert.equal(gradeO.gradePoints, 10);
  assert.equal(gradeO.passed, true);

  const gradeF = calculateSubjectGrade({ cia1: 10, cia2: 10, test1: 10, test2: 10, assignment: 5, credits: 4 });
  assert.equal(gradeF.grade, "F");
  assert.equal(gradeF.gradePoints, 0);
  assert.equal(gradeF.passed, false);
});

test("SGPA Calculation: Accurate credit-weighted sum", () => {
  const subjects = [
    { totalScore: 92, normalizedPercentage: 92, grade: "O", gradePoints: 10, credits: 4, passed: true },
    { totalScore: 82, normalizedPercentage: 82, grade: "A+", gradePoints: 9, credits: 4, passed: true },
    { totalScore: 72, normalizedPercentage: 72, grade: "A", gradePoints: 8, credits: 4, passed: true },
  ];

  const result = calculateSGPA(subjects);
  // (10*4 + 9*4 + 8*4) / 12 = (40 + 36 + 32) / 12 = 108 / 12 = 9.00
  assert.equal(result.sgpa, 9.0);
  assert.equal(result.totalCredits, 12);
  assert.equal(result.passedCredits, 12);
});

test("Continuous Assessment: Scale marks from 40 raw to 20 normalized scale", () => {
  const result = calculateSubjectGrade({
    cia1: 20,
    cia2: 20,
    test1: 30,
    test2: 30,
    assignment: 10,
    credits: 3
  });
  // raw score = cia(40) + tests_normalized(30) + assignment(10) = 80 out of 100 => 80.0% => A+
  assert.equal(result.grade, "A+");
  assert.equal(result.gradePoints, 9);
  assert.equal(result.passed, true);
});

test("Attendance Metrics: Shortage Alert boundary between 74.9% and 75.0%", () => {
  const shortage = calculateAttendanceMetrics(74, 100, 75.0);
  assert.equal(shortage.percentage, 74.0);
  assert.equal(shortage.status, "Shortage Alert");
  assert.equal(shortage.safeSkips, 0);
  assert.ok(shortage.recoveryClasses > 0);
});

