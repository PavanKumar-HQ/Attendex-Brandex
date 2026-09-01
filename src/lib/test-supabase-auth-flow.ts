import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ecuklegnixpfppaowhmf.supabase.co";
const supabaseAnonKey = "sb_publishable_vxlOwJKyk9pXp2LOyoehrg_90z1mDzF";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthGmail() {
  const email = `parent.test.${Date.now()}@gmail.com`;
  const password = "Password123!Secure";

  console.log("1. Signing up with valid email:", email);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password
  });
  console.log("Sign up result:", signUpData?.user?.id, "Error:", signUpErr);

  if (signUpData?.session) {
    console.log("2. Testing insert into leave_requests with real authenticated session...");
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${signUpData.session.access_token}`
        }
      }
    });

    const { data: leave, error: leaveErr } = await authClient
      .from("leave_requests")
      .insert({
        institution_id: "00000000-0000-0000-0000-000000000001",
        student_id: "00000000-0000-0000-0000-000000000001",
        applied_by_user_id: signUpData.user?.id,
        leave_type: "MEDICAL",
        start_date: "2026-09-05",
        end_date: "2026-09-07",
        reason: "Severe viral fever diagnosed with 3 days hospital bed rest.",
        status: "PENDING"
      })
      .select();

    console.log("Real database insert result:", leave, "Error:", leaveErr);
  }
}

testAuthGmail();
