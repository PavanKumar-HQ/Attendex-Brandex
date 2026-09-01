import { supabase } from "./supabase";

async function testInsert() {
  const leaveId = "c1111111-0000-4000-a000-000000000099";
  const institutionId = "00000000-0000-0000-0000-000000000001";
  const studentId = "00000000-0000-0000-0000-000000000030";
  const appliedByUserId = "00000000-0000-0000-0000-000000000005";

  const { data, error } = await supabase
    .from("leave_requests")
    .insert({
      id: leaveId,
      institution_id: institutionId,
      student_id: studentId,
      applied_by_user_id: appliedByUserId,
      leave_type: "MEDICAL",
      start_date: "2026-09-10",
      end_date: "2026-09-12",
      reason: "Test leave insertion reason",
      status: "PENDING"
    })
    .select();

  console.log("Insert Result:", { data, error });
}

testInsert();
