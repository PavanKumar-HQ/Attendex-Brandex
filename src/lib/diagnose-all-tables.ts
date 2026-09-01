import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ecuklegnixpfppaowhmf.supabase.co";
const supabaseAnonKey = "sb_publishable_vxlOwJKyk9pXp2LOyoehrg_90z1mDzF";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TABLES = [
  "institutions",
  "user_profiles",
  "students",
  "teachers",
  "parents",
  "classes",
  "subjects",
  "class_enrollments",
  "teacher_subject_assignments",
  "parent_student_relationships",
  "attendance_sessions",
  "attendance_records",
  "leave_requests",
  "gatepasses",
  "assessment_components",
  "marks",
  "notifications",
  "audit_logs"
];

async function runDatabaseAudit() {
  console.log("=== ATTENDEX SUPABASE DATABASE AUDIT ===");
  const results: Record<string, { status: string; count: number; error?: string }> = {};

  for (const table of TABLES) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact" })
        .limit(3);

      if (error) {
        results[table] = { status: "ERROR", count: 0, error: error.message };
      } else {
        results[table] = { status: "OK", count: count || (data ? data.length : 0) };
      }
    } catch (err: any) {
      results[table] = { status: "EXCEPTION", count: 0, error: err.message };
    }
  }

  console.table(results);

  console.log("\n=== TESTING CORE JOINS & RELATIONSHIPS ===");
  // Test 1: Students with Classes
  const { data: studentJoin, error: sjErr } = await supabase
    .from("students")
    .select("id, name, roll_number, classes(id, name, section)")
    .limit(3);
  console.log("Students -> Classes Join:", sjErr ? `FAILED: ${sjErr.message}` : `SUCCESS (rows: ${studentJoin?.length})`);

  // Test 2: Teachers with Assignments
  const { data: teacherJoin, error: tjErr } = await supabase
    .from("teachers")
    .select("id, employee_id, teacher_subject_assignments(id, class_id, subject_id)")
    .limit(3);
  console.log("Teachers -> Assignments Join:", tjErr ? `FAILED: ${tjErr.message}` : `SUCCESS (rows: ${teacherJoin?.length})`);

  // Test 3: Leave Requests
  const { data: leaves, error: lErr } = await supabase
    .from("leave_requests")
    .select("id, leave_type, status, start_date, end_date")
    .limit(3);
  console.log("Leave Requests Table:", lErr ? `FAILED: ${lErr.message}` : `SUCCESS (rows: ${leaves?.length})`);
}

runDatabaseAudit();
