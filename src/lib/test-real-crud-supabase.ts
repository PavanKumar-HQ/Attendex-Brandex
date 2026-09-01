import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const supabaseUrl = "https://ecuklegnixpfppaowhmf.supabase.co";
const supabaseAnonKey = "sb_publishable_vxlOwJKyk9pXp2LOyoehrg_90z1mDzF";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const INSTITUTION_ID = "00000000-0000-0000-0000-000000000001";

async function testFullDatabaseCRUD() {
  console.log("1. Generating valid UUID for new leave request...");
  const leaveId = randomUUID();
  console.log("Generated Leave UUID:", leaveId);

  // Note: If foreign keys are not enforced for demo users or if we insert valid mock UUIDs
  console.log("2. Testing insert into leave_requests with real UUID...");
  const { data: inserted, error: insertErr } = await supabase
    .from("leave_requests")
    .insert({
      id: leaveId,
      institution_id: INSTITUTION_ID,
      student_id: INSTITUTION_ID, // Use valid UUID
      applied_by_user_id: INSTITUTION_ID, // Use valid UUID
      leave_type: "MEDICAL",
      start_date: "2026-09-05",
      end_date: "2026-09-07",
      reason: "Acute viral fever requiring medical bed rest.",
      status: "PENDING"
    })
    .select();

  console.log("Insert result:", inserted, "Error:", insertErr);

  console.log("3. Testing query by UUID eq...");
  const { data: fetched, error: fetchErr } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("id", leaveId);

  console.log("Fetched record:", fetched, "Error:", fetchErr);

  console.log("4. Testing atomic UPDATE to APPROVED...");
  const { data: updated, error: updateErr } = await supabase
    .from("leave_requests")
    .update({
      status: "APPROVED",
      reviewed_by: INSTITUTION_ID,
      reviewed_at: new Date().toISOString(),
      review_notes: "Medical prescription verified by faculty."
    })
    .eq("id", leaveId)
    .select();

  console.log("Update result:", updated, "Error:", updateErr);
}

testFullDatabaseCRUD();
