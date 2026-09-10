import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MASTER_TIMETABLE: Record<string, any[]> = {
  Monday: [
    { id: "tt-1", day_of_week: "Monday", subject: "Distributed Systems & Cloud (CS404)", teacher_name: "Prof. Arvind Sharma", room_number: "Hall 401", start_time: "09:00", end_time: "10:30", color_code: "blue", class_id: "cls-csa" },
    { id: "tt-2", day_of_week: "Monday", subject: "Database Architecture & SQL Lab (CS401)", teacher_name: "Dr. P. Patel", room_number: "Computing Lab 2", start_time: "11:00", end_time: "12:30", color_code: "indigo", class_id: "cls-csa" },
    { id: "tt-3", day_of_week: "Monday", subject: "Computer Networks & Security (CS403)", teacher_name: "Prof. A. Iyer", room_number: "Hall 302", start_time: "14:00", end_time: "15:30", color_code: "emerald", class_id: "cls-csa" }
  ],
  Tuesday: [
    { id: "tt-4", day_of_week: "Tuesday", subject: "Artificial Intelligence & Robotics (AI601)", teacher_name: "Dr. Priya Kulkarni", room_number: "Hall 201", start_time: "09:00", end_time: "10:30", color_code: "amber", class_id: "cls-csa" },
    { id: "tt-5", day_of_week: "Tuesday", subject: "Deep Learning & Neural Nets Lab (AI602)", teacher_name: "Dr. Priya Kulkarni", room_number: "AI Lab Block B", start_time: "11:00", end_time: "13:00", color_code: "rose", class_id: "cls-csa" }
  ],
  Wednesday: [
    { id: "tt-6", day_of_week: "Wednesday", subject: "Operating Systems & Kernel Dev (CS402)", teacher_name: "Prof. Arvind Sharma", room_number: "Hall 401", start_time: "09:00", end_time: "10:30", color_code: "blue", class_id: "cls-csa" },
    { id: "tt-7", day_of_week: "Wednesday", subject: "Design & Analysis of Algorithms (CS405)", teacher_name: "Dr. S. Kulkarni", room_number: "Computing Lab 1", start_time: "11:00", end_time: "12:30", color_code: "indigo", class_id: "cls-csa" }
  ],
  Thursday: [
    { id: "tt-8", day_of_week: "Thursday", subject: "Database Architecture (CS401)", teacher_name: "Dr. P. Patel", room_number: "Hall 302", start_time: "10:00", end_time: "11:30", color_code: "emerald", class_id: "cls-csa" },
    { id: "tt-9", day_of_week: "Thursday", subject: "Engineering Capstone Practicum", teacher_name: "Faculty Panel", room_number: "Innovation Hub", start_time: "14:00", end_time: "16:00", color_code: "amber", class_id: "cls-csa" }
  ],
  Friday: [
    { id: "tt-10", day_of_week: "Friday", subject: "Distributed Systems & Cloud (CS404)", teacher_name: "Prof. Arvind Sharma", room_number: "Hall 401", start_time: "09:00", end_time: "10:30", color_code: "rose", class_id: "cls-csa" },
    { id: "tt-11", day_of_week: "Friday", subject: "Department Colloquium Seminar", teacher_name: "Dean of Academics", room_number: "Main Auditorium", start_time: "14:00", end_time: "15:30", color_code: "blue", class_id: "cls-csa" }
  ],
  Saturday: [
    { id: "tt-12", day_of_week: "Saturday", subject: "Industry Mentorship & Expert Lecture", teacher_name: "Industry Experts", room_number: "Seminar Hall 201", start_time: "10:00", end_time: "12:00", color_code: "emerald", class_id: "cls-csa" }
  ]
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const day = searchParams.get("day");

    if (day && MASTER_TIMETABLE[day]) {
      return NextResponse.json({
        success: true,
        data: MASTER_TIMETABLE[day]
      });
    }

    return NextResponse.json({
      success: true,
      data: MASTER_TIMETABLE
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
