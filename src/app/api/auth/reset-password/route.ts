import { NextRequest, NextResponse } from "next/server";
import { recoveryStore } from "../recover/route";
import { computePasswordHash } from "@/lib/server-auth";
import { serverState } from "@/lib/server-state";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { normalizeDob } from "@/lib/student-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, pin, new_password } = body;

    if (!identifier || !pin || !new_password) {
      return NextResponse.json(
        { success: false, message: "Identifier, 6-digit PIN, and new password are required." },
        { status: 400 }
      );
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanPin = pin.trim();

    const session = recoveryStore.get(cleanId);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "No active recovery session found for this identifier. Please request a new code." },
        { status: 400 }
      );
    }

    if (Date.now() > session.expiresAt) {
      recoveryStore.delete(cleanId);
      return NextResponse.json(
        { success: false, message: "Recovery PIN has expired (15-minute time window elapsed). Please request a new code." },
        { status: 400 }
      );
    }

    if (session.pin !== cleanPin) {
      return NextResponse.json(
        { success: false, message: "Invalid 6-digit verification code. Please check your PIN and try again." },
        { status: 401 }
      );
    }

    // ─── 1. RESET FOR STUDENT ───
    if (session.role === "STUDENT") {
      const normalizedDob = normalizeDob(new_password);
      const passwordHash = computePasswordHash(normalizedDob);

      // Update in serverState
      serverState.updateStudent(session.identifier, {
        dob: normalizedDob,
        formatted_dob: new_password.includes("/") ? new_password : `${normalizedDob.slice(0, 2)}/${normalizedDob.slice(2, 4)}/${normalizedDob.slice(4)}`
      });

      // Update in PostgreSQL Supabase table if configured
      if (isSupabaseConfigured) {
        try {
          await supabase
            .from("students")
            .update({
              dob: normalizedDob,
              password_hash: passwordHash,
              updated_at: new Date().toISOString()
            })
            .or(`roll_number.ilike.%${session.identifier}%,register_number.ilike.%${session.identifier}%`);
        } catch {
          // ignore
        }
      }

      recoveryStore.delete(cleanId);
      if (session.studentId) recoveryStore.delete(session.studentId.toLowerCase());

      return NextResponse.json({
        success: true,
        message: "Credentials successfully updated. You may now log in using your Roll Number and new Date of Birth (DDMMYYYY)."
      });
    }

    // ─── 2. RESET FOR STAFF / PARENT ───
    const passwordHash = computePasswordHash(new_password.trim());

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from("user_profiles")
          .update({
            password_hash: passwordHash,
            updated_at: new Date().toISOString()
          })
          .eq("email", session.userEmail || session.identifier);
      } catch {
        // ignore
      }
    }

    recoveryStore.delete(cleanId);

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You may now log in to your institutional workspace with your new password."
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
