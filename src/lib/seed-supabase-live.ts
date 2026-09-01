import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ecuklegnixpfppaowhmf.supabase.co";
const supabaseAnonKey = "sb_publishable_vxlOwJKyk9pXp2LOyoehrg_90z1mDzF";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const INSTITUTION_ID = "00000000-0000-0000-0000-000000000001";
const ADMIN_USER_ID = "00000000-0000-0000-0000-000000000002";
const TEACHER_USER_ID = "00000000-0000-0000-0000-000000000003";
const STUDENT_USER_ID = "00000000-0000-0000-0000-000000000004";
const PARENT_USER_ID = "00000000-0000-0000-0000-000000000005";

const DEPT_CSE_ID = "00000000-0000-0000-0000-000000000010";
const CLASS_CSE_4A_ID = "00000000-0000-0000-0000-000000000020";
const STUDENT_RAHUL_ID = "00000000-0000-0000-0000-000000000030";
const TEACHER_RECORD_ID = "00000000-0000-0000-0000-000000000040";

async function seedLiveDatabase() {
  console.log("Seeding live Supabase database...");

  // 1. User Profiles
  console.log("1. Upserting user_profiles...");
  const profiles = [
    {
      id: ADMIN_USER_ID,
      institution_id: INSTITUTION_ID,
      email: "principal@attendex.edu",
      role: "ADMIN",
      full_name: "Dr. K. S. Ramanujam (Principal)",
      status: "ACTIVE"
    },
    {
      id: TEACHER_USER_ID,
      institution_id: INSTITUTION_ID,
      email: "faculty@attendex.edu",
      role: "TEACHER",
      full_name: "Prof. Rajesh Verma",
      status: "ACTIVE"
    },
    {
      id: STUDENT_USER_ID,
      institution_id: INSTITUTION_ID,
      email: "student@attendex.edu",
      role: "STUDENT",
      full_name: "Rahul Deshmukh",
      status: "ACTIVE"
    },
    {
      id: PARENT_USER_ID,
      institution_id: INSTITUTION_ID,
      email: "parent@attendex.edu",
      role: "PARENT",
      full_name: "Suresh Deshmukh (Guardian)",
      status: "ACTIVE"
    }
  ];

  const { error: pErr } = await supabase.from("user_profiles").upsert(profiles);
  console.log("Profiles error:", pErr);

  // 2. Department
  console.log("2. Upserting department...");
  const { error: dErr } = await supabase.from("departments").upsert([
    {
      id: DEPT_CSE_ID,
      institution_id: INSTITUTION_ID,
      name: "Computer Science & Engineering",
      code: "CSE",
      hod_name: "Dr. Ananya Roy"
    }
  ]);
  console.log("Department error:", dErr);

  // 3. Class
  console.log("3. Upserting class...");
  const { error: cErr } = await supabase.from("classes").upsert([
    {
      id: CLASS_CSE_4A_ID,
      institution_id: INSTITUTION_ID,
      department_id: DEPT_CSE_ID,
      name: "B.Tech Computer Science",
      section: "4A",
      year: 2,
      semester: 4,
      batch_year: 2026,
      academic_year: "2026-2027",
      room_number: "LH-302"
    }
  ]);
  console.log("Class error:", cErr);

  // 4. Teacher Record
  console.log("4. Upserting teacher record...");
  const { error: tErr } = await supabase.from("teachers").upsert([
    {
      id: TEACHER_RECORD_ID,
      user_id: TEACHER_USER_ID,
      institution_id: INSTITUTION_ID,
      department_id: DEPT_CSE_ID,
      employee_id: "FAC-1001",
      designation: "Associate Professor"
    }
  ]);
  console.log("Teacher error:", tErr);

  // 5. Students
  console.log("5. Upserting students...");
  const studentRows = [
    {
      id: STUDENT_RAHUL_ID,
      user_id: STUDENT_USER_ID,
      institution_id: INSTITUTION_ID,
      class_id: CLASS_CSE_4A_ID,
      roll_number: "21CS042",
      name: "Rahul Deshmukh",
      email: "rahul.d@attendex.edu",
      phone: "+91 98450 12345",
      batch: "A",
      cgpa: 8.85,
      attendance_percentage: 88.5,
      total_sessions: 60,
      attended_sessions: 53,
      status: "ACTIVE"
    },
    {
      id: "00000000-0000-0000-0000-000000000031",
      institution_id: INSTITUTION_ID,
      class_id: CLASS_CSE_4A_ID,
      roll_number: "21CS001",
      name: "Aarav Sharma",
      email: "aarav.s@attendex.edu",
      phone: "+91 98450 12301",
      batch: "A",
      cgpa: 9.10,
      attendance_percentage: 95.0,
      total_sessions: 60,
      attended_sessions: 57,
      status: "ACTIVE"
    },
    {
      id: "00000000-0000-0000-0000-000000000032",
      institution_id: INSTITUTION_ID,
      class_id: CLASS_CSE_4A_ID,
      roll_number: "21CS002",
      name: "Priya Patel",
      email: "priya.p@attendex.edu",
      phone: "+91 98450 12302",
      batch: "A",
      cgpa: 8.40,
      attendance_percentage: 72.0, // Defaulter
      total_sessions: 60,
      attended_sessions: 43,
      status: "ACTIVE"
    },
    {
      id: "00000000-0000-0000-0000-000000000033",
      institution_id: INSTITUTION_ID,
      class_id: CLASS_CSE_4A_ID,
      roll_number: "21CS003",
      name: "Rohan Gupta",
      email: "rohan.g@attendex.edu",
      phone: "+91 98450 12303",
      batch: "B",
      cgpa: 7.90,
      attendance_percentage: 84.0,
      total_sessions: 60,
      attended_sessions: 50,
      status: "ACTIVE"
    }
  ];

  const { error: sErr } = await supabase.from("students").upsert(studentRows);
  console.log("Students error:", sErr);

  // 6. Subjects
  console.log("6. Upserting subjects...");
  const { error: subErr } = await supabase.from("subjects").upsert([
    {
      id: "00000000-0000-0000-0000-000000000050",
      institution_id: INSTITUTION_ID,
      department_id: DEPT_CSE_ID,
      code: "CS401",
      name: "Database Management Systems",
      credits: 4,
      semester: 4,
      color_code: "#2563eb"
    },
    {
      id: "00000000-0000-0000-0000-000000000051",
      institution_id: INSTITUTION_ID,
      department_id: DEPT_CSE_ID,
      code: "CS402",
      name: "Design & Analysis of Algorithms",
      credits: 4,
      semester: 4,
      color_code: "#7c3aed"
    }
  ]);
  console.log("Subjects error:", subErr);

  console.log("✅ Seed script finished!");
}

seedLiveDatabase().catch(console.error);
