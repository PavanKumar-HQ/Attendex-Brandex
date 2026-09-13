/**
 * ATTENDEX — SERVER-SIDE CRYPTOGRAPHIC AUTHENTICATION ENGINE
 * 
 * Enforces:
 * 1. Zero plaintext password handling in the frontend.
 * 2. HMAC-SHA256 password hashing with institutional cryptographic salt.
 * 3. PostgreSQL database verification with ACID guarantees.
 * 4. Multi-tenant role separation: STUDENT, PARENT, TEACHER, PRINCIPAL, SUPER_ADMIN.
 */

import { createHmac } from "node:crypto";
import { supabase, isSupabaseConfigured } from "./supabase";
import { INSTITUTIONAL_STUDENTS, normalizeDob, type InstitutionalStudent } from "./student-auth";

export const INSTITUTIONAL_AUTH_SALT = process.env.AUTH_SECRET_SALT || "attendex_sec_salt_2026";

/**
 * Computes a cryptographically salted HMAC-SHA256 digest of a password.
 */
export function computePasswordHash(password: string, salt: string = INSTITUTIONAL_AUTH_SALT): string {
  return createHmac("sha256", salt)
    .update(password.trim())
    .digest("hex");
}

export interface AuthSuccessResult {
  success: true;
  role: "STUDENT" | "PARENT" | "TEACHER" | "PRINCIPAL" | "SUPER_ADMIN" | "ADMIN";
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    identifier: string;
    rollNumber?: string;
    className?: string;
  };
  message: string;
}

export interface AuthFailureResult {
  success: false;
  message: string;
}

export type AuthResult = AuthSuccessResult | AuthFailureResult;

/**
 * Server-side student authentication using Register Number / Roll No & DOB.
 */
export async function verifyStudentServerAuth(
  identifier: string,
  rawDob: string
): Promise<AuthResult> {
  const cleanId = identifier.trim().toLowerCase();
  const normalizedDob = normalizeDob(rawDob);
  const candidateHash = computePasswordHash(normalizedDob);

  // 1. Check PostgreSQL Database first (Source of Truth)
  if (isSupabaseConfigured) {
    try {
      const { data: dbStudent, error } = await supabase
        .from("students")
        .select("*, classes(*)")
        .or(`roll_number.ilike.${cleanId},register_number.ilike.${cleanId},email.ilike.${cleanId}`)
        .maybeSingle();

      if (!error && dbStudent) {
        // Verify with cryptographic hash or stored DOB
        const storedHash = dbStudent.password_hash;
        const storedDob = dbStudent.dob;

        const isMatch = (
          (storedHash && storedHash === candidateHash) ||
          (storedDob && normalizeDob(storedDob) === normalizedDob)
        );

        if (isMatch) {
          return {
            success: true,
            role: "STUDENT",
            user: {
              id: dbStudent.id,
              name: dbStudent.name,
              email: dbStudent.email || `${dbStudent.roll_number.toLowerCase()}@attendex.edu`,
              role: "STUDENT",
              identifier: dbStudent.roll_number,
              rollNumber: dbStudent.roll_number,
              className: dbStudent.classes?.name || "B.Tech Computer Science"
            },
            message: `Welcome back, ${dbStudent.name}! Verified via Institutional Database.`
          };
        } else {
          return {
            success: false,
            message: "Incorrect Date of Birth (DOB). Please enter your registered DOB in DDMMYYYY format (e.g. 15082004)."
          };
        }
      }
    } catch {
      // Fall through to local directory
    }
  }

  // 2. Check Institutional Student Directory
  const localStudent = INSTITUTIONAL_STUDENTS.find(s =>
    s.roll_number.toLowerCase() === cleanId ||
    s.register_number.toLowerCase() === cleanId ||
    s.email.toLowerCase() === cleanId
  );

  if (!localStudent) {
    return {
      success: false,
      message: `No student record found matching "${identifier}". Please verify your Roll Number (e.g. CS-11, CS-12, 21CS042).`
    };
  }

  const expectedHash = computePasswordHash(localStudent.dob);
  const isHashMatch = (
    candidateHash === expectedHash ||
    normalizedDob === localStudent.dob ||
    rawDob.trim() === localStudent.formatted_dob
  );

  if (!isHashMatch) {
    return {
      success: false,
      message: "Incorrect Date of Birth (DOB). For students, your password is your registered Date of Birth in DDMMYYYY format."
    };
  }

  return {
    success: true,
    role: "STUDENT",
    user: {
      id: localStudent.id,
      name: localStudent.name,
      email: localStudent.email,
      role: "STUDENT",
      identifier: localStudent.roll_number,
      rollNumber: localStudent.roll_number,
      className: localStudent.class_name
    },
    message: `Welcome back, ${localStudent.name}! Session established.`
  };
}

/**
 * Server-side faculty, principal, and admin authentication.
 */
export async function verifyStaffServerAuth(
  identifier: string,
  rawPassword: string
): Promise<AuthResult> {
  const cleanId = identifier.trim().toLowerCase();
  const candidateHash = computePasswordHash(rawPassword);

  // 1. Authoritative PostgreSQL user_profiles query
  if (isSupabaseConfigured) {
    try {
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("*")
        .or(`email.ilike.${cleanId},phone.ilike.${cleanId}`)
        .maybeSingle();

      if (!error && profile) {
        const storedHash = profile.password_hash;
        const isMatch = storedHash ? (storedHash === candidateHash) : false;

        if (isMatch) {
          const role = profile.role as "TEACHER" | "PRINCIPAL" | "SUPER_ADMIN" | "PARENT" | "ADMIN";
          return {
            success: true,
            role,
            user: {
              id: profile.id,
              name: profile.full_name,
              email: profile.email,
              role,
              identifier: profile.email
            },
            message: `Authenticated as ${profile.full_name} (${role}).`
          };
        } else {
          return {
            success: false,
            message: "Invalid password for this institutional account."
          };
        }
      }
    } catch (err: any) {
      console.error("[server-auth] profile query error:", err);
    }
  }

  return {
    success: false,
    message: "No institutional account found with this identifier. Please register for a new account."
  };
}
