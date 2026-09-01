/**
 * Attendex — Report Generation Service
 * Generates CSV and tabular export streams from dynamic database records.
 */

import type { ReportRequest } from "@/types";
import { ATTENDANCE_THRESHOLD } from "@/lib/constants";

export interface ReportOutput {
  filename: string;
  contentType: string;
  data: string;
}

export interface StudentReportRow {
  name: string;
  roll: string;
  attendance: number;
  class: string;
}

/**
 * Generate a Defaulter List (students below attendance threshold).
 */
export function generateDefaulterList(students: StudentReportRow[] = []): ReportOutput {
  const defaulters = students.filter(
    (s) => s.attendance < ATTENDANCE_THRESHOLD
  );

  const rows = defaulters.map(
    (s) => `${s.roll},${s.name},${s.attendance}%,${s.class}`
  );
  const csv = ["Roll,Name,Attendance,Class", ...rows].join("\n");
  const date = new Date().toISOString().split("T")[0];

  return {
    filename: `defaulter_list_${date}.csv`,
    contentType: "text/csv",
    data: csv,
  };
}

/**
 * Generate Monthly Attendance Sheet.
 */
export function generateMonthlySheet(students: StudentReportRow[] = []): ReportOutput {
  const rows = students.map(
    (s) => `${s.roll},${s.name},${s.attendance}%,${s.class}`
  );
  const csv = [
    "Roll,Name,Attendance %,Class",
    ...rows,
    "",
    `Generated: ${new Date().toLocaleString()}`,
    `Total Students: ${students.length}`,
  ].join("\n");

  const date = new Date().toISOString().split("T")[0];

  return {
    filename: `monthly_attendance_${date}.csv`,
    contentType: "text/csv",
    data: csv,
  };
}

/**
 * Route report generation by type.
 */
export function generateReport(request: ReportRequest, students: StudentReportRow[] = []): ReportOutput {
  switch (request.type) {
    case "DEFAULTER_LIST":
      return generateDefaulterList(students);
    case "MONTHLY_SHEET":
      return generateMonthlySheet(students);
    case "DEPARTMENT_OVERVIEW":
      return generateMonthlySheet(students);
    default:
      throw new Error(`Unknown report type: ${request.type}`);
  }
}
