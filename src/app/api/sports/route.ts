import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/server-state";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const entries = serverState.getSports();
    return NextResponse.json({
      success: true,
      data: entries
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { entries } = body;

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({ success: false, error: "Entries array required" }, { status: 400 });
    }

    const classes = serverState.getClasses();

    for (const e of entries) {
      const cls = classes.find(c => c.id === e.class_id);
      serverState.addSportsEntry({
        id: `sp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        category: e.category,
        class_id: e.class_id,
        class_name: cls ? cls.name : "Class",
        position: e.position || "1st",
        points: Number(e.points) || 5,
        recorded_at: new Date().toISOString()
      });
    }

    serverState.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "SPORTS_ACHIEVEMENTS_LOGGED",
      entity_type: "sports",
      performed_by: "Sports Coordinator",
      details: `Logged ${entries.length} athletic achievements`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, count: entries.length, message: "Sports achievements recorded" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
