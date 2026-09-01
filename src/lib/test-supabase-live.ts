import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ecuklegnixpfppaowhmf.supabase.co";
const supabaseAnonKey = "sb_publishable_vxlOwJKyk9pXp2LOyoehrg_90z1mDzF";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testExactSchema() {
  console.log("1. Fetching user_profiles and students...");
  const { data: profiles, error: pErr } = await supabase.from("user_profiles").select("id, role, full_name");
  console.log("Profiles in DB:", profiles, "Error:", pErr);

  const { data: students, error: sErr } = await supabase.from("students").select("id, name, roll_number, class_id");
  console.log("Students in DB:", students, "Error:", sErr);

  const { data: classes, error: cErr } = await supabase.from("classes").select("id, name");
  console.log("Classes in DB:", classes, "Error:", cErr);

  const { data: depts, error: dErr } = await supabase.from("departments").select("id, name");
  console.log("Departments in DB:", depts, "Error:", dErr);
}

testExactSchema();
