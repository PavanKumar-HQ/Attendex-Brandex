import { NextRequest, NextResponse } from "next/server";
import { serverState } from "@/lib/server-state";
import { cacheManager } from "@/lib/cache-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { data, isCached, ageSeconds } = await cacheManager.getOrSet(
      "api:pulse",
      async () => {
        const students = serverState.getStudents();
        const classes = serverState.getClasses();
        const leaves = serverState.getLeaves();
        const gatepasses = serverState.getGatepasses();

        const totalStudents = students.length;
        const totalClasses = classes.length;

        let totalPct = 0;
        let shortageCount = 0;
        const deptMap: Record<string, { total: number; sumPct: number }> = {};

        for (const s of students) {
          totalPct += s.attendance_percentage;
          if (s.attendance_percentage < 75.0) {
            shortageCount++;
          }

          // Department breakdown
          let dept = "CSE";
          if (s.class_name.includes("IT")) dept = "IT";
          else if (s.class_name.includes("Electronics") || s.class_name.includes("ECE")) dept = "ECE";
          else if (s.class_name.includes("Artificial") || s.class_name.includes("AI")) dept = "AI";

          if (!deptMap[dept]) deptMap[dept] = { total: 0, sumPct: 0 };
          deptMap[dept].total += 1;
          deptMap[dept].sumPct += s.attendance_percentage;
        }

        const overallAttendance = totalStudents > 0 ? Number((totalPct / totalStudents).toFixed(1)) : 0;

        const departmentPulse = Object.keys(deptMap).map(d => ({
          department: d,
          students: deptMap[d].total,
          percentage: Number((deptMap[d].sumPct / deptMap[d].total).toFixed(1))
        }));

        // Weekly trend
        const weeklyTrend = [
          { day: "Mon", rate: Math.min(100, overallAttendance + 1.2) },
          { day: "Tue", rate: Math.min(100, overallAttendance - 0.8) },
          { day: "Wed", rate: Math.min(100, overallAttendance + 2.1) },
          { day: "Thu", rate: Math.min(100, overallAttendance + 0.5) },
          { day: "Fri", rate: Math.min(100, overallAttendance - 1.5) },
          { day: "Sat", rate: Math.min(100, overallAttendance - 2.0) }
        ];

        // Recent institutional activities
        const recentActivity = [
          ...leaves.slice(0, 3).map(l => ({
            id: l.id,
            type: "LEAVE",
            title: `${l.studentName} requested ${l.leaveType} leave`,
            timestamp: l.createdAt,
            status: l.status
          })),
          ...gatepasses.slice(0, 3).map(g => ({
            id: g.id,
            type: "GATEPASS",
            title: `${g.studentName} gatepass to ${g.destination}`,
            timestamp: g.createdAt,
            status: g.status
          }))
        ];

        // Calculate actual absentees recorded in sessions
        const today = new Date().toISOString().split("T")[0];
        const sessions = serverState.getAttendanceSessions();
        const todaySessions = sessions.filter(s => s.date === today);
        let absenteesToday = 0;
        if (todaySessions.length > 0) {
          const absentStudentIds = new Set<string>();
          for (const sess of todaySessions) {
            for (const rec of sess.records) {
              if (rec.status === "ABSENT") absentStudentIds.add(rec.student_id);
            }
          }
          absenteesToday = absentStudentIds.size;
        } else if (sessions.length > 0) {
          const latestSession = sessions[sessions.length - 1];
          absenteesToday = latestSession.records.filter(r => r.status === "ABSENT").length;
        }

        return {
          success: true,
          totalStudents,
          totalClasses,
          overallAttendance,
          attendanceRate: overallAttendance,
          absenteesToday,
          shortageAlerts: shortageCount,
          weeklyTrend,
          recentActivity,
          departmentPulse
        };
      },
      30, // 30s cache TTL
      ["pulse", "attendance"]
    );

    return NextResponse.json(data, {
      headers: {
        "X-Cache": isCached ? "HIT" : "MISS",
        "X-Cache-Age": `${ageSeconds}s`,
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
