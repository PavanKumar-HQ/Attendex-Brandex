import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { computePasswordHash } from "@/lib/server-auth";
import { verifyServerRole } from "@/lib/rbac-guard";
import { randomUUID } from "node:crypto";

const DEFAULT_INSTITUTION_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_DEPARTMENT_ID = "10000000-0000-0000-0000-000000000001";

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce strict Admin / Principal RBAC
    const auth = verifyServerRole(req, ["ADMIN", "SUPER_ADMIN", "PRINCIPAL"]);
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const {
      fullName,
      email: rawEmail,
      password = "ChangeMe@2026",
      role = "TEACHER",
      phone = "",
      employeeId = "",
      departmentId = DEFAULT_DEPARTMENT_ID,
      designation = ""
    } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { success: false, message: "Full Name is required for staff provisioning." },
        { status: 400 }
      );
    }

    const cleanEmail = (rawEmail || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Valid institutional email address is required." },
        { status: 400 }
      );
    }

    const targetRole = String(role).toUpperCase();
    if (!["TEACHER", "PRINCIPAL", "ADMIN"].includes(targetRole)) {
      return NextResponse.json(
        { success: false, message: "Target role must be TEACHER, PRINCIPAL, or ADMIN." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, message: "Database connection unavailable." },
        { status: 503 }
      );
    }

    // 2. Check if user already exists
    const { data: existingUser } = await supabase
      .from("user_profiles")
      .select("id, email, role")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: `An institutional user with email ${cleanEmail} already exists (${existingUser.role}).` },
        { status: 409 }
      );
    }

    const userId = randomUUID();
    const passwordHash = computePasswordHash(password);
    const cleanEmployeeId = employeeId.trim() || `EMP-${Date.now().toString().slice(-6)}`;
    const effectiveDesignation = designation.trim() || (targetRole === "PRINCIPAL" ? "Principal & Head of Institution" : "Senior Faculty");

    // 3. Insert into user_profiles
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: userId,
        institution_id: DEFAULT_INSTITUTION_ID,
        role: targetRole,
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
      return NextResponse.json(
        { success: false, message: `Database error creating user profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // 4. If Faculty or Principal, also insert into teachers table
    if (targetRole === "TEACHER" || targetRole === "PRINCIPAL") {
      const teacherId = randomUUID();
      await supabase
        .from("teachers")
        .insert({
          id: teacherId,
          institution_id: DEFAULT_INSTITUTION_ID,
          department_id: departmentId || DEFAULT_DEPARTMENT_ID,
          employee_id: cleanEmployeeId,
          name: fullName.trim(),
          email: cleanEmail,
          designation: effectiveDesignation,
          phone: phone.trim() || null,
          created_at: new Date().toISOString()
        });
    }

    // 5. Audit Log
    try {
      await supabase.from("audit_logs").insert({
        institution_id: DEFAULT_INSTITUTION_ID,
        actor_id: auth.userEmail || "institutional-admin",
        action: "STAFF_PROVISIONED",
        entity_type: "user_profiles",
        entity_id: userId,
        metadata: {
          provisionedRole: targetRole,
          provisionedEmail: cleanEmail,
          employeeId: cleanEmployeeId,
          provisionedBy: auth.role
        },
        timestamp: new Date().toISOString()
      });
    } catch {
      // Non-blocking audit log
    }

    return NextResponse.json({
      success: true,
      message: `Staff account successfully provisioned for ${fullName.trim()} (${targetRole}).`,
      user: {
        id: userId,
        name: fullName.trim(),
        email: cleanEmail,
        role: targetRole,
        employeeId: cleanEmployeeId
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error provisioning staff." },
      { status: 500 }
    );
  }
}
