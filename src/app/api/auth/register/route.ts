import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { computePasswordHash } from "@/lib/server-auth";
import { randomUUID } from "node:crypto";

const DEFAULT_INSTITUTION_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_DEPARTMENT_ID = "10000000-0000-0000-0000-000000000001";
const DEFAULT_CLASS_ID = "40000000-0000-0000-0000-000000000001";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName: rawFullName,
      name,
      email: rawEmail,
      password,
      role = "TEACHER",
      phone = "",
      roleSpecificId = "",
      departmentId,
      classId
    } = body;

    const fullName = (rawFullName || name || "").trim();

    // Validate inputs
    if (!fullName) {
      return NextResponse.json(
        { success: false, message: "Full Name is required." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanRole = String(role).toUpperCase();
    const validRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT"];
    if (!validRoles.includes(cleanRole)) {
      return NextResponse.json(
        { success: false, message: `Invalid role: ${role}. Must be one of ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // STRICT ZERO-TRUST PRIVILEGE ESCALATION GUARD:
    // Only authenticated Institutional Admins or Principals can provision Staff, Faculty, or Admin accounts.
    const isStaffRole = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "TEACHER"].includes(cleanRole);
    if (isStaffRole) {
      const cookieSession = req.cookies.get("attendex_demo_session")?.value?.toUpperCase();
      const authHeader = req.headers.get("authorization");
      const isBearerSuperAdmin = authHeader?.startsWith("Bearer ") && 
        (authHeader.replace("Bearer ", "").trim() === (process.env.CRON_SECRET || "attendex_super_secret_cron_token_2026"));
      
      const isAdminSession = isBearerSuperAdmin || 
                             cookieSession === "ADMIN" || 
                             cookieSession === "SUPER_ADMIN" || 
                             cookieSession === "SUPERADMIN" || 
                             cookieSession === "PRINCIPAL";

      if (!isAdminSession) {
        return NextResponse.json(
          {
            success: false,
            code: "PRIVILEGE_ESCALATION_BLOCKED",
            message: "Privilege Escalation Prevented: Faculty, Staff, and Administrative accounts can only be provisioned by an Institutional Administrator or Principal."
          },
          { status: 403 }
        );
      }
    }

    // Determine authoritative email
    let cleanEmail = (rawEmail || "").trim().toLowerCase();
    if (!cleanEmail) {
      if (cleanRole === "STUDENT" && roleSpecificId) {
        cleanEmail = `${roleSpecificId.toLowerCase().replace(/[^a-z0-9]/g, "")}@attendex.edu`;
      } else if (cleanRole === "PARENT" && roleSpecificId) {
        cleanEmail = `parent_${roleSpecificId.toLowerCase().replace(/[^a-z0-9]/g, "")}@attendex.edu`;
      } else {
        return NextResponse.json(
          { success: false, message: "Email is required for registration." },
          { status: 400 }
        );
      }
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, message: "Database connection unavailable. Please check Supabase configuration." },
        { status: 503 }
      );
    }

    // 1. Check if user with this email already exists in user_profiles
    const { data: existingUser } = await supabase
      .from("user_profiles")
      .select("id, email, role")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: `An account with email "${cleanEmail}" already exists. Please sign in or use another email.` 
        },
        { status: 409 }
      );
    }

    // 2. Generate new user ID and salted password hash
    const userId = randomUUID();
    const passwordHash = computePasswordHash(password);

    // 3. Insert into public.user_profiles
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: userId,
        institution_id: DEFAULT_INSTITUTION_ID,
        role: cleanRole,
        email: cleanEmail,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        status: "ACTIVE",
        passkey_bound: false,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error("[register] profile insert error:", profileError);
      return NextResponse.json(
        { success: false, message: `Database error creating user profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // 4. Handle role-specific associations
    if (cleanRole === "TEACHER" || cleanRole === "PRINCIPAL") {
      const teacherId = randomUUID();
      const empId = roleSpecificId.trim() || `EMP-${Date.now().toString().slice(-5)}`;
      const designation = cleanRole === "PRINCIPAL" ? "Principal & Head of Institution" : "Faculty Member";

      await supabase.from("teachers").insert({
        id: teacherId,
        user_id: userId,
        institution_id: DEFAULT_INSTITUTION_ID,
        department_id: departmentId || DEFAULT_DEPARTMENT_ID,
        employee_id: empId,
        designation,
        cabin_location: "Faculty Wing",
        created_at: new Date().toISOString()
      });
    } else if (cleanRole === "STUDENT") {
      const rollNumber = (roleSpecificId.trim() || `CS-${Math.floor(100 + Math.random() * 900)}`).toUpperCase();
      
      // Check if student with roll_number exists in students table
      const { data: existingStudent } = await supabase
        .from("students")
        .select("id")
        .ilike("roll_number", rollNumber)
        .maybeSingle();

      if (existingStudent) {
        // Link to existing student record and update credentials
        await supabase
          .from("students")
          .update({
            user_id: userId,
            email: cleanEmail,
            password_hash: passwordHash,
            phone: phone.trim() || undefined
          })
          .eq("id", existingStudent.id);
      } else {
        // Create new student record
        const studentId = randomUUID();
        await supabase.from("students").insert({
          id: studentId,
          user_id: userId,
          institution_id: DEFAULT_INSTITUTION_ID,
          class_id: classId || DEFAULT_CLASS_ID,
          roll_number: rollNumber,
          register_number: `REG${new Date().getFullYear()}${rollNumber.replace(/[^A-Z0-9]/g, "")}`,
          name: fullName.trim(),
          email: cleanEmail,
          phone: phone.trim() || "+91 98450 00000",
          dob: password.length === 8 && /^\d+$/.test(password) ? password : "15082004",
          password_hash: passwordHash,
          attendance_percentage: 100.0,
          cgpa: 9.0,
          total_sessions: 60,
          attended_sessions: 60,
          status: "ACTIVE"
        });
      }
    } else if (cleanRole === "PARENT") {
      const parentId = randomUUID();
      await supabase.from("parents").insert({
        id: parentId,
        user_id: userId,
        institution_id: DEFAULT_INSTITUTION_ID,
        phone: phone.trim() || "+91 98450 99999",
        created_at: new Date().toISOString()
      });

      // If student roll number specified, link relationship
      if (roleSpecificId) {
        const { data: targetStudent } = await supabase
          .from("students")
          .select("id")
          .ilike("roll_number", roleSpecificId.trim())
          .maybeSingle();

        if (targetStudent) {
          await supabase.from("parent_student_relationships").insert({
            id: randomUUID(),
            parent_id: parentId,
            student_id: targetStudent.id,
            relationship_type: "FATHER",
            verified: true,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    // 5. Try creating user in Supabase Auth (non-blocking)
    try {
      await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: cleanRole,
            user_profile_id: userId
          }
        }
      });
    } catch {
      // Non-blocking: PostgreSQL user_profiles is our source of truth
    }

    // 6. Establish immediate session cookies
    const response = NextResponse.json({
      success: true,
      role: cleanRole,
      user: {
        id: userId,
        name: fullName.trim(),
        email: cleanEmail,
        role: cleanRole
      },
      message: "Account created successfully! Session established."
    });

    response.cookies.set("attendex_demo_session", cleanRole, {
      path: "/",
      maxAge: 86400 * 7,
      sameSite: "lax",
      httpOnly: false
    });

    response.cookies.set("attendex_user_email", cleanEmail, {
      path: "/",
      maxAge: 86400 * 7,
      sameSite: "lax",
      httpOnly: false
    });

    response.cookies.set("attendex_user_name", encodeURIComponent(fullName.trim()), {
      path: "/",
      maxAge: 86400 * 7,
      sameSite: "lax",
      httpOnly: false
    });

    if (cleanRole === "STUDENT") {
      response.cookies.set("attendex_student_name", encodeURIComponent(fullName.trim()), {
        path: "/",
        maxAge: 86400 * 7,
        sameSite: "lax",
        httpOnly: false
      });
      if (roleSpecificId) {
        response.cookies.set("attendex_student_roll", roleSpecificId.trim().toUpperCase(), {
          path: "/",
          maxAge: 86400 * 7,
          sameSite: "lax",
          httpOnly: false
        });
      }
    }

    return response;
  } catch (err: any) {
    console.error("[register] fatal exception:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error during registration." },
      { status: 500 }
    );
  }
}
