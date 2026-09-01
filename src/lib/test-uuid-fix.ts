import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ecuklegnixpfppaowhmf.supabase.co";
const supabaseAnonKey = "sb_publishable_vxlOwJKyk9pXp2LOyoehrg_90z1mDzF";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUUID() {
  console.log("1. Testing query with invalid text ID 'LV-8091'...");
  const { data: invalidData, error: invalidErr } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("id", "LV-8091");
  console.log("Invalid ID query result:", invalidData, "Error:", invalidErr);

  console.log("2. Testing query with valid UUID '00000000-0000-0000-0000-000000000001'...");
  const { data: validData, error: validErr } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("id", "00000000-0000-0000-0000-000000000001");
  console.log("Valid UUID query result:", validData, "Error:", validErr);
}

testUUID();
