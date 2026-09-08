import { NextRequest, NextResponse } from "next/server";
import { verifyStaffServerAuth } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "Institutional identifier and password are required." },
        { status: 400 }
      );
    }

    const result = await verifyStaffServerAuth(identifier, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      role: result.role,
      user: result.user,
      message: result.message
    });

    // Set authoritative session cookie
    response.cookies.set("attendex_demo_session", result.role, {
      path: "/",
      maxAge: 86400 * 7,
      sameSite: "lax",
      httpOnly: false
    });

    response.cookies.set("attendex_user_email", result.user.email, {
      path: "/",
      maxAge: 86400 * 7,
      sameSite: "lax",
      httpOnly: false
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Internal server error during staff authentication." },
      { status: 500 }
    );
  }
}
