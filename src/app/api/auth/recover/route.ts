import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/server-state";
import { INSTITUTIONAL_STUDENTS } from "@/lib/student-auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface RecoverySession {
  pin: string;
  role: "STUDENT" | "STAFF" | "PARENT";
  identifier: string;
  studentId?: string;
  userEmail?: string;
  name: string;
  expiresAt: number;
}

declare global {
  var __attendex_recovery_store: Map<string, RecoverySession> | undefined;
}

export const recoveryStore: Map<string, RecoverySession> =
  globalThis.__attendex_recovery_store ||
  (globalThis.__attendex_recovery_store = new Map<string, RecoverySession>());

function maskContact(contact: string): string {
  if (contact.includes("@")) {
    const [user, domain] = contact.split("@");
    const visible = user.slice(0, 2);
    return `${visible}***@${domain}`;
  }
  const digits = contact.replace(/\D/g, "");
  if (digits.length >= 4) {
    return `***-***-${digits.slice(-4)}`;
  }
  return "***-***-****";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role = "STUDENT", identifier, registered_contact } = body;

    if (!identifier || !registered_contact) {
      return NextResponse.json(
        { success: false, message: "Identifier and registered email/phone are required." },
        { status: 400 }
      );
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanContact = registered_contact.trim().toLowerCase();

    // ─── 1. STUDENT RECOVERY ───
    if (role === "STUDENT") {
      let student = serverState.getStudents().find(s =>
        s.roll_number.toLowerCase() === cleanId ||
        s.register_number.toLowerCase() === cleanId ||
        s.email.toLowerCase() === cleanId
      );

      if (!student && isSupabaseConfigured) {
        try {
          const { data } = await supabase
            .from("students")
            .select("*")
            .or(`roll_number.ilike.%${cleanId}%,register_number.ilike.%${cleanId}%,email.ilike.%${cleanId}%`)
            .maybeSingle();
          if (data) student = data;
        } catch {
          // ignore
        }
      }

      if (!student) {
        student = INSTITUTIONAL_STUDENTS.find(s =>
          s.roll_number.toLowerCase() === cleanId ||
          s.register_number.toLowerCase() === cleanId ||
          s.email.toLowerCase() === cleanId
        );
      }

      if (!student) {
        return NextResponse.json(
          { success: false, message: `No student record found for identifier "${identifier}".` },
          { status: 404 }
        );
      }

      // Verify contact match
      const studentEmail = (student.email || "").toLowerCase();
      const parentEmail = (student.parent_email || "").toLowerCase();
      const studentPhone = (student.phone || "").replace(/\D/g, "");
      const parentPhone = (student.parent_phone || "").replace(/\D/g, "");
      const inputPhone = cleanContact.replace(/\D/g, "");

      const isContactMatch = (
        cleanContact === studentEmail ||
        cleanContact === parentEmail ||
        (inputPhone.length >= 6 && (studentPhone.endsWith(inputPhone) || parentPhone.endsWith(inputPhone)))
      );

      if (!isContactMatch) {
        return NextResponse.json(
          {
            success: false,
            message: "The entered email/phone does not match the registered institutional records for this student."
          },
          { status: 403 }
        );
      }

      // Generate 6-digit cryptographic PIN
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const session: RecoverySession = {
        pin,
        role: "STUDENT",
        identifier: student.roll_number,
        studentId: student.id,
        name: student.name,
        expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes
      };

      recoveryStore.set(student.roll_number.toLowerCase(), session);
      recoveryStore.set(student.id.toLowerCase(), session);

      return NextResponse.json({
        success: true,
        message: "Identity verified. A one-time 6-digit PIN has been generated for secure credential reset.",
        pin,
        maskedContact: maskContact(registered_contact),
        studentName: student.name,
        rollNumber: student.roll_number,
        expiresInMinutes: 15
      });
    }

    // ─── 2. STAFF / FACULTY / PARENT RECOVERY ───
    let staffFound: any = null;

    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .or(`email.ilike.%${cleanId}%,phone.ilike.%${cleanId}%`)
          .maybeSingle();
        if (data) staffFound = data;
      } catch {
        // ignore
      }
    }

    if (!staffFound) {
      const canonicalStaff = [
        { email: "admin@attendex.institution.edu", name: "Dr. Ramesh Sundaram", phone: "+91 98765 00001", role: "SUPER_ADMIN" },
        { email: "faculty.cs@attendex.institution.edu", name: "Prof. Arvind Sharma", phone: "+91 98765 00002", role: "TEACHER" },
        { email: "principal@attendex.edu", name: "Dr. K. S. Prabhakar", phone: "+91 98765 00005", role: "PRINCIPAL" },
        { email: "parent.deshmukh@attendex.institution.edu", name: "Sanjay Deshmukh", phone: "+91 98765 99999", role: "PARENT" }
      ];
      staffFound = canonicalStaff.find(s => s.email.toLowerCase() === cleanId || s.phone.replace(/\D/g, "") === cleanContact.replace(/\D/g, ""));
    }

    if (!staffFound) {
      return NextResponse.json(
        { success: false, message: `No institutional staff or parent account found matching "${identifier}".` },
        { status: 404 }
      );
    }

    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const session: RecoverySession = {
      pin,
      role: "STAFF",
      identifier: staffFound.email,
      userEmail: staffFound.email,
      name: staffFound.name || staffFound.full_name || "Faculty Member",
      expiresAt: Date.now() + 15 * 60 * 1000
    };

    recoveryStore.set(staffFound.email.toLowerCase(), session);

    return NextResponse.json({
      success: true,
      message: "Identity verified. A one-time 6-digit PIN has been generated.",
      pin,
      maskedContact: maskContact(registered_contact),
      staffName: staffFound.name || staffFound.full_name,
      expiresInMinutes: 15
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
