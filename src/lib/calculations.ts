/**
 * Attendex — Core Academic Calculation Engine
 * Pure mathematical functions for Attendance Telemetry, Safe Skips, Recovery Classes, and SGPA/CGPA.
 */

export interface AttendanceStats {
  attended: number;
  conducted: number;
  percentage: number;
  safeSkips: number;
  recoveryClasses: number;
  status: "Good Standing" | "Critical Danger" | "Shortage Alert";
}

/**
 * Calculates authoritative attendance percentage and 75% rule buffer metrics.
 * 
 * @param attended Number of attended sessions (including approved OD & ML)
 * @param conducted Number of total conducted sessions
 * @param threshold Minimum institutional attendance percentage requirement (default: 75.0)
 */
export function calculateAttendanceMetrics(
  attended: number,
  conducted: number,
  threshold: number = 75.0
): AttendanceStats {
  const safeAttended = Math.max(0, attended);
  const safeConducted = Math.max(0, conducted);

  if (safeConducted === 0) {
    return {
      attended: safeAttended,
      conducted: safeConducted,
      percentage: 100.0,
      safeSkips: 0,
      recoveryClasses: 0,
      status: "Good Standing"
    };
  }

  const percentage = Number(((safeAttended / safeConducted) * 100).toFixed(2));
  const tFraction = threshold / 100.0;

  let safeSkips = 0;
  let recoveryClasses = 0;

  if (percentage >= threshold) {
    // Maximum future absences x such that: attended / (conducted + x) >= threshold / 100
    // => x <= (attended / (threshold / 100)) - conducted
    // => x <= (100 * attended - threshold * conducted) / threshold
    const maxSkips = Math.floor((safeAttended - (tFraction * safeConducted)) / tFraction);
    safeSkips = Math.max(0, maxSkips);
  } else {
    // Minimum future attended lectures y such that: (attended + y) / (conducted + y) >= threshold / 100
    // => (1 - threshold / 100) * y >= (threshold / 100) * conducted - attended
    // => y >= ((threshold * conducted) - (100 * attended)) / (100 - threshold)
    const needed = Math.ceil(((threshold * safeConducted) - (100 * safeAttended)) / (100 - threshold));
    recoveryClasses = Math.max(0, needed);
  }

  let status: AttendanceStats["status"] = "Good Standing";
  if (percentage < 65.0) {
    status = "Critical Danger";
  } else if (percentage < threshold) {
    status = "Shortage Alert";
  }

  return {
    attended: safeAttended,
    conducted: safeConducted,
    percentage,
    safeSkips,
    recoveryClasses,
    status
  };
}

export interface SubjectAssessment {
  cia1: number; // out of 25 (or scaled)
  cia2: number; // out of 25
  test1?: number; // raw out of 40
  test2?: number; // raw out of 40
  assignment?: number; // out of 10
  lab?: number;
  maxMarks?: number;
  credits: number;
}

export interface GradeResult {
  totalScore: number;
  normalizedPercentage: number;
  grade: string;
  gradePoints: number;
  credits: number;
  passed: boolean;
}

/**
 * Normalizes assessment components and maps to institutional letter grade and grade points.
 */
export function calculateSubjectGrade(assessment: SubjectAssessment): GradeResult {
  const ciaTotal = (assessment.cia1 || 0) + (assessment.cia2 || 0);
  const testNormalized = (((assessment.test1 || 0) + (assessment.test2 || 0)) / 80) * 40;
  const assignmentTotal = assessment.assignment || 0;
  const labTotal = assessment.lab || 0;

  const totalScore = Math.min(100, ciaTotal + testNormalized + assignmentTotal + labTotal);
  const max = assessment.maxMarks || 100;
  const normalizedPercentage = Number(((totalScore / max) * 100).toFixed(2));

  let grade = "F";
  let gradePoints = 0;
  let passed = false;

  if (normalizedPercentage >= 90) {
    grade = "O";
    gradePoints = 10;
    passed = true;
  } else if (normalizedPercentage >= 80) {
    grade = "A+";
    gradePoints = 9;
    passed = true;
  } else if (normalizedPercentage >= 70) {
    grade = "A";
    gradePoints = 8;
    passed = true;
  } else if (normalizedPercentage >= 60) {
    grade = "B+";
    gradePoints = 7;
    passed = true;
  } else if (normalizedPercentage >= 55) {
    grade = "B";
    gradePoints = 6;
    passed = true;
  } else if (normalizedPercentage >= 50) {
    grade = "C";
    gradePoints = 5;
    passed = true;
  } else {
    grade = "F";
    gradePoints = 0;
    passed = false;
  }

  return {
    totalScore,
    normalizedPercentage,
    grade,
    gradePoints,
    credits: assessment.credits,
    passed
  };
}

/**
 * Calculates Semester Grade Point Average (SGPA) as a credit-weighted average.
 */
export function calculateSGPA(subjectGrades: GradeResult[]): { sgpa: number; totalCredits: number; passedCredits: number } {
  if (subjectGrades.length === 0) {
    return { sgpa: 0.0, totalCredits: 0, passedCredits: 0 };
  }

  let totalCreditPoints = 0;
  let totalCredits = 0;
  let passedCredits = 0;

  for (const sub of subjectGrades) {
    totalCreditPoints += sub.gradePoints * sub.credits;
    totalCredits += sub.credits;
    if (sub.passed) {
      passedCredits += sub.credits;
    }
  }

  const sgpa = totalCredits > 0 ? Number((totalCreditPoints / totalCredits).toFixed(2)) : 0.0;

  return {
    sgpa,
    totalCredits,
    passedCredits
  };
}
