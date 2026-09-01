import { supabase } from "./supabase";

const ALL_SYSTEM_TABLES = [
  "institutions",
  "institution_settings",
  "departments",
  "programs",
  "batches",
  "classes",
  "user_profiles",
  "teachers",
  "students",
  "parents",
  "parent_student_relationships",
  "subjects",
  "teacher_subject_assignments",
  "timetables",
  "timetable_entries",
  "attendance_sessions",
  "attendance_records",
  "leave_requests",
  "gatepasses",
  "gatepass_events",
  "assessment_components",
  "marks",
  "results",
  "hall_tickets",
  "assignments",
  "assignment_submissions",
  "fee_structures",
  "student_fee_accounts",
  "fee_transactions",
  "proctor_assignments",
  "proctor_meetings",
  "conduct_records",
  "curriculum_units",
  "placement_drives",
  "notifications",
  "audit_logs"
];

async function generateDatabaseInventory() {
  console.log("================================================================================");
  console.log("             ATTENDEX — LIVE SUPABASE DATABASE SCHEMA INVENTORY                 ");
  console.log("================================================================================");

  const inventory: Array<{
    Table: string;
    Status: string;
    LiveRowCount: number | string;
    ErrorDetails: string;
  }> = [];

  for (const tableName of ALL_SYSTEM_TABLES) {
    try {
      const { data, count, error } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });

      if (error) {
        inventory.push({
          Table: tableName,
          Status: "ERROR / RLS RESTRICTED",
          LiveRowCount: "0",
          ErrorDetails: error.message
        });
      } else {
        inventory.push({
          Table: tableName,
          Status: "EXISTS & ACCESSIBLE",
          LiveRowCount: count ?? 0,
          ErrorDetails: "None"
        });
      }
    } catch (err: any) {
      inventory.push({
        Table: tableName,
        Status: "EXCEPTION",
        LiveRowCount: "0",
        ErrorDetails: err.message || "Unknown error"
      });
    }
  }

  console.table(inventory);

  // Inspect Root Institution
  const { data: inst } = await supabase.from("institutions").select("*").limit(1);
  console.log("\n[Root Institution in Live DB]:", inst ? inst[0] : "None");
}

generateDatabaseInventory();
