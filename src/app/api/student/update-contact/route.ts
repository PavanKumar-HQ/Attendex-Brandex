import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/server-state";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { studentId, rollNumber, phone } = await req.json();

    if (!phone || String(phone).trim().length < 8) {
      return NextResponse.json(
        { success: false, message: "Valid phone number is required." },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).trim();

    // 1. Update in memory / persistent disk state
    if (studentId) {
      serverState.updateStudent(studentId, { phone: cleanPhone });
    }
    if (rollNumber) {
      serverState.updateStudent(rollNumber, { phone: cleanPhone });
    }

    // 2. Propagate to Supabase PostgreSQL database
    if (isSupabaseConfigured) {
      try {
        if (studentId) {
          await supabase
            .from("students")
            .update({ phone: cleanPhone, updated_at: new Date().toISOString() })
            .eq("id", studentId);
        } else if (rollNumber) {
          await supabase
            .from("students")
            .update({ phone: cleanPhone, updated_at: new Date().toISOString() })
            .ilike("roll_number", rollNumber.trim());
        }
      } catch (err) {
        console.warn("[update-contact] Supabase update warning:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Phone number updated successfully in institutional profile.",
      phone: cleanPhone
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to update phone number" },
      { status: 500 }
    );
  }
}
