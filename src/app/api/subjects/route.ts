import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/server-state";
import { cacheManager } from "@/lib/cache-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const semester = searchParams.get("semester");
    const cacheKey = `api:subjects:${department || "all"}:${semester || "all"}`;

    const { data, isCached, ageSeconds } = await cacheManager.getOrSet(
      cacheKey,
      async () => {
        let subjects = serverState.getSubjects();

        if (department && department !== "all") {
          subjects = subjects.filter(s => s.department === department);
        }
        if (semester && semester !== "all") {
          subjects = subjects.filter(s => s.semester === Number(semester));
        }

        return {
          success: true,
          data: subjects
        };
      },
      300, // 5 minutes TTL
      ["subjects"]
    );

    return NextResponse.json(data, {
      headers: {
        "X-Cache": isCached ? "HIT" : "MISS",
        "X-Cache-Age": `${ageSeconds}s`,
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.code) {
      return NextResponse.json({ success: false, error: "Subject name and code are required" }, { status: 400 });
    }

    const newSubject = {
      id: body.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code: body.code.toUpperCase().trim(),
      name: body.name.trim(),
      department: body.department || "CSE",
      credits: Number(body.credits) || 4,
      semester: Number(body.semester) || 1,
      year: Number(body.year) || 1,
      is_lab: Boolean(body.is_lab || body.name.toLowerCase().includes("lab"))
    };

    serverState.addSubject(newSubject);
    cacheManager.invalidateTags(["subjects"]);

    serverState.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "SUBJECT_REGISTRATION",
      entity_type: "subjects",
      entity_id: newSubject.id,
      performed_by: "Academic Dean",
      details: `Registered curriculum subject ${newSubject.code}: ${newSubject.name}`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, data: newSubject });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Subject ID required" }, { status: 400 });
    }

    serverState.updateSubject(body.id, body);
    cacheManager.invalidateTags(["subjects"]);

    serverState.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "SUBJECT_UPDATE",
      entity_type: "subjects",
      entity_id: body.id,
      performed_by: "Academic Dean",
      details: `Updated curriculum subject ${body.code || body.id}`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, message: "Subject curriculum updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
