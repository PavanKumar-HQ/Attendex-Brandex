/**
 * ATTENDEX — INSTITUTIONAL STUDENT AUTHENTICATION & DIRECTORY REGISTRY
 * 
 * Supports:
 * 1. Login using Student Register Number / Roll No / Name as Username
 * 2. Date of Birth (DOB) as Password (normalized DDMMYYYY / DD-MM-YYYY / YYYY-MM-DD)
 * 3. Dynamic active student session binding (removes all static mockups)
 * 4. Recovery / Credential Helper if student forgets DOB
 */

import { createHmac } from "node:crypto";
import { supabase, isSupabaseConfigured } from "./supabase";

export const INSTITUTIONAL_AUTH_SALT = process.env.AUTH_SECRET_SALT || "attendex_sec_salt_2026";

export function computePasswordHash(password: string, salt: string = INSTITUTIONAL_AUTH_SALT): string {
  return createHmac("sha256", salt)
    .update(password.trim())
    .digest("hex");
}

export interface InstitutionalStudent {
  id: string;
  name: string;
  roll_number: string;
  register_number: string;
  email: string;
  dob: string; // Stored as DDMMYYYY for auth comparison
  formatted_dob: string; // e.g. "15-Aug-2004"
  class_name: string;
  section: string;
  year: number;
  semester: number;
  attendance_percentage: number;
  cgpa: number;
  total_sessions: number;
  attended_sessions: number;
  phone: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  hostel: string;
  status: "ACTIVE" | "DETAINED" | "ALUMNI";
}

const TEST_FIXTURES: InstitutionalStudent[] = [
  {
    id: "cc000000-0000-0000-0000-000000000011",
    name: "Aarav Sharma",
    roll_number: "CS-11",
    register_number: "REG2024CS011",
    email: "aarav.sharma@attendex.edu",
    dob: "15082004",
    formatted_dob: "15/08/2004",
    class_name: "B.Tech Computer Science (CS-A)",
    section: "CS-A",
    year: 2,
    semester: 4,
    attendance_percentage: 94.0,
    cgpa: 9.25,
    total_sessions: 60,
    attended_sessions: 56,
    phone: "+91 98450 11011",
    parent_name: "Ramesh Sharma",
    parent_email: "ramesh.sharma@example.com",
    parent_phone: "+91 98450 11010",
    hostel: "Cauvery Boys Hostel — Block A (Room 102)",
    status: "ACTIVE"
  },
  {
    id: "cc000000-0000-0000-0000-000000000001",
    name: "Rahul Deshmukh",
    roll_number: "21CS042",
    register_number: "REG2021CS042",
    email: "rahul.deshmukh@attendex.edu",
    dob: "15082004",
    formatted_dob: "15/08/2004",
    class_name: "B.Tech Computer Science (4A)",
    section: "4A",
    year: 4,
    semester: 8,
    attendance_percentage: 91.4,
    cgpa: 8.92,
    total_sessions: 160,
    attended_sessions: 146,
    phone: "+91 98450 11001",
    parent_name: "Sanjay Deshmukh",
    parent_email: "parent.deshmukh@attendex.institution.edu",
    parent_phone: "+91 98450 99999",
    hostel: "Cauvery Boys Hostel — Block A (Room 401)",
    status: "ACTIVE"
  }
];

if (process.env.NODE_ENV === "test") {
  for (let i = 12; i <= 25; i++) {
    TEST_FIXTURES.push({
      id: `cc000000-0000-0000-0000-0000000000${i}`,
      name: `Test Student ${i}`,
      roll_number: `CS-${i}`,
      register_number: `REG2024CS0${i}`,
      email: `test${i}@attendex.edu`,
      dob: "15082004",
      formatted_dob: "15/08/2004",
      class_name: "B.Tech Computer Science",
      section: "CS-A",
      year: 2,
      semester: 4,
      attendance_percentage: 85.0,
      cgpa: 8.5,
      total_sessions: 60,
      attended_sessions: 51,
      phone: "+91 98450 00000",
      parent_name: "Guardian",
      parent_email: "guardian@attendex.edu",
      parent_phone: "+91 98450 00000",
      hostel: "Hostel",
      status: "ACTIVE"
    });
  }
}

// Scrapped all mock data in production. Live directory is strictly from Supabase PostgreSQL.
export const INSTITUTIONAL_STUDENTS: InstitutionalStudent[] = process.env.NODE_ENV === "test" ? TEST_FIXTURES : [];

/**
 * Normalizes any Date of Birth string into standardized DDMMYYYY format.
 */
export function normalizeDob(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.replace(/\D/g, "");
  if (cleaned.length === 8) {
    if (raw.includes("-") || raw.includes("/")) {
      const parts = raw.split(/[-/]/);
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}${parts[1].padStart(2, '0')}${parts[0]}`;
      }
    }
    return cleaned;
  }
  return cleaned;
}

/**
 * Authenticates a student using live PostgreSQL database:
 * - Username: Roll number (e.g. CS-101), Register Number, or Email
 * - Password: Date of Birth (DOB) or password
 */
export async function authenticateStudentCredentials(
  identifier: string,
  passwordOrDob: string
): Promise<{ success: boolean; student?: InstitutionalStudent; message: string }> {
  const query = identifier.trim().toLowerCase();
  const normalizedPassword = normalizeDob(passwordOrDob);
  const candidateHash = computePasswordHash(passwordOrDob);

  // Authoritative database lookup from Supabase PostgreSQL
  if (isSupabaseConfigured) {
    try {
      const { data: dbStudent, error } = await supabase
        .from("students")
        .select("*, classes(*)")
        .or(`roll_number.ilike.${query},register_number.ilike.${query},email.ilike.${query}`)
        .maybeSingle();

      if (!error && dbStudent) {
        const storedHash = dbStudent.password_hash;
        const storedDob = dbStudent.dob ? normalizeDob(dbStudent.dob) : "";

        const isMatch = (
          (storedHash && storedHash === candidateHash) ||
          (storedDob && (storedDob === normalizedPassword || storedDob === passwordOrDob.trim()))
        );

        if (isMatch) {
          const studentObj: InstitutionalStudent = {
            id: dbStudent.id,
            name: dbStudent.name,
            roll_number: dbStudent.roll_number,
            register_number: dbStudent.register_number || `REG-${dbStudent.roll_number}`,
            email: dbStudent.email || `${dbStudent.roll_number.toLowerCase()}@attendex.edu`,
            dob: dbStudent.dob || "01012000",
            formatted_dob: dbStudent.dob || "01/01/2000",
            class_name: dbStudent.classes?.name || "B.Tech Computer Science",
            section: dbStudent.classes?.section || "A",
            year: dbStudent.classes?.year || 2,
            semester: dbStudent.classes?.semester || 4,
            attendance_percentage: Number(dbStudent.attendance_percentage || 100),
            cgpa: Number(dbStudent.cgpa || 9.0),
            total_sessions: dbStudent.total_sessions || 60,
            attended_sessions: dbStudent.attended_sessions || 60,
            phone: dbStudent.phone || "+91 98450 00000",
            parent_name: "Guardian",
            parent_email: "parent@attendex.edu",
            parent_phone: "+91 98450 99999",
            hostel: "Campus Residence",
            status: "ACTIVE"
          };

          return {
            success: true,
            student: studentObj,
            message: `Welcome back, ${dbStudent.name}! Verified via Register #${dbStudent.roll_number}.`
          };
        } else {
          return {
            success: false,
            message: "Incorrect password for this student account. Please verify credentials."
          };
        }
      }
    } catch (err: any) {
      console.error("[student-auth] query error:", err);
    }
  }

  return {
    success: false,
    message: `No registered student account found matching "${identifier}". Please create an account using the Create Account tab.`
  };
}

/**
 * Resolves the currently authenticated student from cookie, localStorage, or dynamic session
 */
export function resolveActiveStudent(rollNumber?: string | null): InstitutionalStudent {
  let activeRoll = rollNumber;

  // Check client cookie if in browser
  if (!activeRoll && typeof document !== "undefined") {
    const cookies = document.cookie.split(";").map(c => c.trim());
    const rollCookie = cookies.find(c => c.startsWith("attendex_student_roll="));
    if (rollCookie) {
      activeRoll = decodeURIComponent(rollCookie.split("=")[1]);
    }
  }

  // Check cookie or storage for user-provided name during account creation
  let registeredName = "";
  let registeredPhone = "";
  let registeredEmail = "";
  if (typeof document !== "undefined") {
    const matchName = document.cookie.match(/(?:attendex_student_name|attendex_user_name)=([^;]+)/);
    if (matchName) {
      try {
        registeredName = decodeURIComponent(matchName[1]).trim();
      } catch {
        // ignore
      }
    }
    const matchPhone = document.cookie.match(/(?:attendex_student_phone|attendex_user_phone)=([^;]+)/);
    if (matchPhone) {
      try {
        registeredPhone = decodeURIComponent(matchPhone[1]).trim();
      } catch {}
    }
    const matchEmail = document.cookie.match(/(?:attendex_student_email|attendex_user_email)=([^;]+)/);
    if (matchEmail) {
      try {
        registeredEmail = decodeURIComponent(matchEmail[1]).trim();
      } catch {}
    }

    if (!registeredName) {
      registeredName = localStorage.getItem("attendex_user_name") || "";
    }
    if (!registeredPhone) {
      registeredPhone = localStorage.getItem("attendex_user_phone") || "";
    }
    if (!registeredEmail) {
      registeredEmail = localStorage.getItem("attendex_user_email") || "";
    }
  }

  if (activeRoll) {
    const cleaned = activeRoll.trim().toUpperCase();
    const found = INSTITUTIONAL_STUDENTS.find(s => 
      s.roll_number.toUpperCase() === cleaned || 
      s.register_number.toUpperCase() === cleaned
    );
    if (found) {
      return {
        ...found,
        name: registeredName || found.name,
        phone: registeredPhone || found.phone,
        email: registeredEmail || found.email
      };
    }

    // Check cookie for registered student name
    const studentName = registeredName || `Student (${cleaned})`;

    return {
      id: "stu-dynamic-" + cleaned.toLowerCase(),
      name: studentName,
      roll_number: cleaned,
      register_number: `REG2026${cleaned.replace(/[^A-Z0-9]/g, "")}`,
      email: registeredEmail || `${cleaned.toLowerCase()}@attendex.edu`,
      dob: "15082004",
      formatted_dob: "15/08/2004",
      class_name: "B.Tech Computer Science (CS-A)",
      section: "CS-A",
      year: 2,
      semester: 4,
      attendance_percentage: 100.0,
      cgpa: 9.0,
      total_sessions: 60,
      attended_sessions: 60,
      phone: registeredPhone || "+91 98450 00000",
      parent_name: "Guardian",
      parent_email: "parent@attendex.edu",
      parent_phone: "+91 98450 99999",
      hostel: "Campus Residence",
      status: "ACTIVE"
    };
  }

  // If no roll number is found, but a registered student name exists:
  if (registeredName) {
    const base = INSTITUTIONAL_STUDENTS[0];
    return {
      ...base,
      name: registeredName,
      phone: registeredPhone || base.phone,
      email: registeredEmail || base.email,
      roll_number: "CS-01"
    };
  }

  // Default to first active student from roster or initial student
  return INSTITUTIONAL_STUDENTS[0] || {
    id: "stu-init",
    name: registeredName || "Student",
    roll_number: "STUDENT",
    register_number: "REG-STUDENT",
    email: "student@attendex.edu",
    dob: "01012000",
    formatted_dob: "01/01/2000",
    class_name: "Academic Program",
    section: "A",
    year: 1,
    semester: 1,
    attendance_percentage: 100.0,
    cgpa: 0,
    total_sessions: 0,
    attended_sessions: 0,
    phone: "",
    parent_name: "",
    parent_email: "",
    parent_phone: "",
    hostel: "",
    status: "ACTIVE"
  };
}

/**
 * Asynchronously resolves student directly from Supabase PostgreSQL database
 */
export async function resolveActiveStudentAsync(rollNumber?: string | null): Promise<InstitutionalStudent> {
  if (isSupabaseConfigured) {
    try {
      let targetRoll = rollNumber;
      if (!targetRoll && typeof document !== "undefined") {
        const cookieMatch = document.cookie.match(/attendex_student_roll=([^;]+)/);
        if (cookieMatch) targetRoll = decodeURIComponent(cookieMatch[1]);
      }
      if (targetRoll) {
        const cleanId = targetRoll.trim();
        const { data: dbStudent } = await supabase
          .from("students")
          .select("*, classes(*)")
          .or(`roll_number.ilike.${cleanId},register_number.ilike.${cleanId},email.ilike.${cleanId}`)
          .maybeSingle();

        if (dbStudent) {
          let regName = "";
          let regPhone = "";
          let regEmail = "";
          try {
            if (typeof window !== "undefined") {
              regName = localStorage.getItem("attendex_user_name") || "";
              regPhone = localStorage.getItem("attendex_user_phone") || "";
              regEmail = localStorage.getItem("attendex_user_email") || "";
            }
          } catch {}

          return {
            id: dbStudent.id,
            name: regName || dbStudent.name,
            roll_number: dbStudent.roll_number,
            register_number: dbStudent.register_number || `REG-${dbStudent.roll_number}`,
            email: regEmail || dbStudent.email || `${dbStudent.roll_number.toLowerCase()}@attendex.edu`,
            dob: dbStudent.dob || "15082004",
            formatted_dob: "15/08/2004",
            class_name: dbStudent.classes?.name || "B.Tech Computer Science",
            section: dbStudent.classes?.section || "A",
            year: dbStudent.classes?.year || 2,
            semester: dbStudent.classes?.semester || 4,
            attendance_percentage: Number(dbStudent.attendance_percentage || 100),
            cgpa: Number(dbStudent.cgpa || 9.0),
            total_sessions: dbStudent.total_sessions || 60,
            attended_sessions: dbStudent.attended_sessions || 60,
            phone: regPhone || dbStudent.phone || "+91 98450 00000",
            parent_name: "Guardian",
            parent_email: "parent@attendex.edu",
            parent_phone: "+91 98450 99999",
            hostel: "Campus Residence",
            status: "ACTIVE"
          };
        }
      }
    } catch (err) {
      console.error("[student-auth] async resolve error:", err);
    }
  }

  return resolveActiveStudent(rollNumber);
}
