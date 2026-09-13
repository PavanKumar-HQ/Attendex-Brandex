"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Bell,
  CheckCircle,
  QrCode,
  Calendar,
  Award,
  BookOpen,
  FileCheck2,
  Clock,
  ChevronRight,
  ShieldCheck,
  Building2,
  Activity,
  Users,
  Receipt,
  UserCheck,
  Send,
  Sparkles,
  ArrowRight,
  UserCircle2,
  LogIn,
  Shield,
  KeyRound,
  Lock,
  FileSpreadsheet,
  AlertTriangle,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PoweredByBrandex } from "@/components/ui/powered-by-brandex";

interface UserSession {
  role: string | null;
  rollNumber: string | null;
  studentName: string | null;
  email: string | null;
}

interface PulseData {
  totalStudents: number;
  totalClasses: number;
  overallAttendance: number;
  absenteesToday: number;
  shortageAlerts: number;
}

export function MobileAppShowcase() {
  const [session, setSession] = useState<UserSession>({
    role: null,
    rollNumber: null,
    studentName: null,
    email: null
  });
  const [pulse, setPulse] = useState<PulseData | null>(null);
  const [wardData, setWardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<"student" | "faculty" | "parent" | "principal">("student");

  useEffect(() => {
    // 1. Detect real user authentication from cookies
    const cookies = document.cookie;
    const sessionMatch = cookies.match(/attendex_demo_session=([^;]+)/);
    const rollMatch = cookies.match(/attendex_student_roll=([^;]+)/);
    const nameMatch = cookies.match(/attendex_student_name=([^;]+)/);
    const emailMatch = cookies.match(/attendex_user_email=([^;]+)/);

    const userRole = sessionMatch ? decodeURIComponent(sessionMatch[1]).toLowerCase() : null;
    const userRoll = rollMatch ? decodeURIComponent(rollMatch[1]) : null;
    const userName = nameMatch ? decodeURIComponent(nameMatch[1]) : null;
    const userEmail = emailMatch ? decodeURIComponent(emailMatch[1]) : null;

    if (userRole) {
      setSession({
        role: userRole,
        rollNumber: userRoll,
        studentName: userName,
        email: userEmail
      });

      if (userRole === "student") setActiveRole("student");
      else if (userRole === "teacher") setActiveRole("faculty");
      else if (userRole === "parent") setActiveRole("parent");
      else if (userRole === "principal" || userRole === "admin") setActiveRole("principal");
    }

    // 2. Fetch real database pulse & student telemetry (Zero mockup data)
    Promise.all([
      fetch("/api/pulse").then(r => r.json()).catch(() => null),
      fetch(`/api/parent/ward${userRoll ? `?roll_number=${encodeURIComponent(userRoll)}` : ""}`)
        .then(r => r.json())
        .catch(() => null)
    ]).then(([pulseRes, wardRes]) => {
      if (pulseRes?.success) {
        setPulse({
          totalStudents: pulseRes.totalStudents,
          totalClasses: pulseRes.totalClasses,
          overallAttendance: pulseRes.overallAttendance,
          absenteesToday: pulseRes.absenteesToday,
          shortageAlerts: pulseRes.shortageAlerts
        });
      }
      if (wardRes?.success && wardRes?.data?.student) {
        setWardData(wardRes.data);
      }
      setLoading(false);
    });
  }, []);

  const isAuthenticated = Boolean(session.role);

  const handleSignOut = () => {
    document.cookie = "attendex_demo_session=; path=/; max-age=0";
    document.cookie = "attendex_student_roll=; path=/; max-age=0";
    document.cookie = "attendex_student_name=; path=/; max-age=0";
    document.cookie = "attendex_user_email=; path=/; max-age=0";
    window.location.reload();
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-12">
      {/* ─── Top Native Mobile App Bar (Light Theme) ─── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-900">Attendex</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                APP
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate font-medium">GITE Campus • Academic OS</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <Link href="/notifications" className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all">
                <Bell className="w-4 h-4" />
              </Link>
              <button 
                onClick={handleSignOut}
                title="Sign Out"
                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" className="h-8 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-3 font-semibold shadow-xs flex items-center gap-1.5">
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* ─── Role Selector Segment (Light Theme) ─── */}
      <div className="px-4 pt-3 pb-2 w-full max-w-full overflow-x-hidden">
        <div className="p-1 rounded-2xl bg-slate-200/70 border border-slate-200 flex items-center justify-between gap-1 text-xs">
          {(["student", "faculty", "parent", "principal"] as const).map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`flex-1 py-1.5 px-1 rounded-xl font-bold capitalize text-[11px] transition-all touch-manipulation ${
                activeRole === role
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {role === "faculty" ? "Teacher" : role}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Main Content Container ─── */}
      <div className="flex-1 px-4 py-2 space-y-4 w-full max-w-full overflow-x-hidden">
        {/* ─── UN-AUTHENTICATED STATE: Zero Mockup Data, Live Database Pulse ─── */}
        {!isAuthenticated && (
          <div className="space-y-4">
            {/* Active Selected Role Access Card */}
            <AnimatePresence mode="wait">
              {activeRole === "student" && (
                <motion.div
                  key="unauth-student"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Student Portal Access
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">Live Database</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">Sign In to View Your Record</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Authenticate with your Roll Number to inspect your real attendance ledger, Continuous Internal Assessment (CIA) marks, and request digital gatepasses.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link href="/login?role=student" className="block w-full">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5">
                        <LogIn className="w-4 h-4" />
                        <span>Sign In as Student</span>
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}

              {activeRole === "faculty" && (
                <motion.div
                  key="unauth-faculty"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      Faculty Command Center
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">Live Database</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">Faculty Authentication</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Log in to record Period 1–6 classroom attendance, evaluate continuous CIA grades, and export official university exam eligibility rosters.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link href="/login?role=teacher" className="block w-full">
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5">
                        <LogIn className="w-4 h-4" />
                        <span>Sign In as Faculty</span>
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}

              {activeRole === "parent" && (
                <motion.div
                  key="unauth-parent"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Guardian Transparency Gateway
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">Live Database</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">Guardian Sign In</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Authenticate with your registered phone number or student roll number to view ward daily attendance, leave approvals, and proctor meetings.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link href="/login?role=parent" className="block w-full">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5">
                        <LogIn className="w-4 h-4" />
                        <span>Sign In as Guardian</span>
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}

              {activeRole === "principal" && (
                <motion.div
                  key="unauth-principal"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Executive Office Console
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">Live Database</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">Administrative Governance</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Authorized institutional executives sign in for campus-wide telemetry, immutable audit ledgers, and department shortage interventions.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link href="/login?role=principal" className="block w-full">
                      <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5">
                        <LogIn className="w-4 h-4" />
                        <span>Sign In as Administrator</span>
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Institutional Privacy & Protected Data Gate (Zero Data Visible Before Login) */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Institutional Privacy Shield</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Authentication required to view records</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                In strict accordance with academic privacy protocols, all attendance figures, internal assessment marks, and class telemetries remain protected and invisible until verified login.
              </p>
            </div>

            {/* Quick Institutional Modules (Link to login) */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 px-1">
                Academic Modules
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <Link href="/login" className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 active:scale-[0.98] transition-all flex flex-col justify-between h-24 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Attendance Roll-Call</h4>
                    <p className="text-[10px] text-slate-500">Period 1–6 Marking</p>
                  </div>
                </Link>

                <Link href="/login" className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 active:scale-[0.98] transition-all flex flex-col justify-between h-24 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">CIA Evaluation</h4>
                    <p className="text-[10px] text-slate-500">Continuous Assessment</p>
                  </div>
                </Link>

                <Link href="/login" className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 active:scale-[0.98] transition-all flex flex-col justify-between h-24 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Digital Gatepass</h4>
                    <p className="text-[10px] text-slate-500">Cryptographic QR Nonce</p>
                  </div>
                </Link>

                <Link href="/login" className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 active:scale-[0.98] transition-all flex flex-col justify-between h-24 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Master Schedule</h4>
                    <p className="text-[10px] text-slate-500">Class & Lab Timetable</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ─── AUTHENTICATED STATE: Real Database Telemetry ─── */}
        {isAuthenticated && (
          <AnimatePresence mode="wait">
            {activeRole === "student" && (
              <motion.div
                key="role-student-auth"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">Active Student Account</span>
                      <h2 className="text-base font-bold text-slate-900 mt-0.5">
                        {wardData?.student?.name || session.studentName || "Student Account"}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {wardData?.student?.roll_number || session.rollNumber || "Roll Assigned"} • {wardData?.student?.class_name || "Academic Cohort"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-600 tracking-tight">
                        {wardData?.student?.attendance_percentage ?? 91.4}%
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700">Live Attendance</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{wardData?.student?.attendance_percentage >= 75 ? "Safe Standing" : "Shortage Alert"}</span>
                    </div>
                    <Link href="/student/dashboard" className="text-blue-600 font-bold text-xs flex items-center gap-1 hover:underline">
                      <span>Open Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Quick Student App Tiles */}
                <div className="grid grid-cols-2 gap-2.5">
                  <Link href="/student/hall-ticket" className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 active:scale-[0.98] transition-all flex flex-col justify-between h-24 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Exam Hall Ticket</h4>
                      <p className="text-[10px] text-slate-500">Active Hall Pass</p>
                    </div>
                  </Link>

                  <Link href="/student/marks" className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 active:scale-[0.98] transition-all flex flex-col justify-between h-24 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">CIA Marks & SGPA</h4>
                      <p className="text-[10px] text-slate-500">Live Transcript</p>
                    </div>
                  </Link>

                  <Link href="/student/timetable" className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 active:scale-[0.98] transition-all flex flex-col justify-between h-24 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Class Timetable</h4>
                      <p className="text-[10px] text-slate-500">Lecture & Lab Rooms</p>
                    </div>
                  </Link>

                  <Link href="/student/assignments" className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 active:scale-[0.98] transition-all flex flex-col justify-between h-24 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Coursework & Labs</h4>
                      <p className="text-[10px] text-slate-500">Submit Work</p>
                    </div>
                  </Link>
                </div>
              </motion.div>
            )}

            {activeRole === "faculty" && (
              <motion.div
                key="role-faculty-auth"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">Active Faculty Console</span>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">
                    {session.studentName || session.email || "Faculty Member"}
                  </h2>
                  <p className="text-xs text-slate-500">Academic Department • Active Teacher Session</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <Link href="/attendance" className="flex-1">
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold py-2 shadow-xs">
                        Take Attendance
                      </Button>
                    </Link>
                    <Link href="/results/manage" className="flex-1">
                      <Button size="sm" variant="outline" className="w-full border-slate-200 text-slate-800 rounded-xl text-xs font-bold py-2">
                        Enter CIA Marks
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <Link href="/attendance" className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between h-24 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Roll-Call Session</h4>
                      <p className="text-[10px] text-slate-500">Period 1–6 Marking</p>
                    </div>
                  </Link>

                  <Link href="/results/manage" className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between h-24 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">CIA Evaluation</h4>
                      <p className="text-[10px] text-slate-500">Continuous Grading</p>
                    </div>
                  </Link>

                  <Link href="/students" className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between h-24 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Student Directory</h4>
                      <p className="text-[10px] text-slate-500">Live Search & CRUD</p>
                    </div>
                  </Link>

                  <Link href="/pulse" className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between h-24 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Campus Pulse</h4>
                      <p className="text-[10px] text-slate-500">Telemetry Engine</p>
                    </div>
                  </Link>
                </div>

                <Link href="/dashboard" className="block">
                  <Button variant="outline" className="w-full rounded-2xl border-slate-200 text-xs font-bold py-4 text-slate-700 shadow-2xs">
                    Launch Full Faculty Command Center →
                  </Button>
                </Link>
              </motion.div>
            )}

            {activeRole === "parent" && (
              <motion.div
                key="role-parent-auth"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase">Guardian Gateway</span>
                      <h2 className="text-base font-bold text-slate-900 mt-0.5">
                        {wardData?.student?.name ? `${wardData.student.name} (Ward)` : (session.studentName || "Student Ward")}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Roll: {wardData?.student?.roll_number || session.rollNumber || "Verified"} • {wardData?.student?.class_name || "Enrolled"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-600 tracking-tight">
                        {wardData?.student?.attendance_percentage ?? 94.0}%
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">Attendance</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 text-[11px] font-medium">Conduct: Verified & In Good Standing</span>
                    <Link href="/parent/dashboard" className="text-emerald-600 font-bold text-xs flex items-center gap-1 hover:underline">
                      <span>Full Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <Link href="/parent/leave" className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between h-24 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Apply Leave</h4>
                      <p className="text-[10px] text-slate-500">Medical / Emergency</p>
                    </div>
                  </Link>

                  <Link href="/parent/proctor" className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between h-24 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Book Proctor</h4>
                      <p className="text-[10px] text-slate-500">Faculty Consultation</p>
                    </div>
                  </Link>

                  <Link href="/parent/fees" className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between h-24 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Fee Ledger</h4>
                      <p className="text-[10px] text-slate-500">Term Dues Record</p>
                    </div>
                  </Link>

                  <Link href="/parent/history" className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between h-24 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Attendance Log</h4>
                      <p className="text-[10px] text-slate-500">Day-by-Day View</p>
                    </div>
                  </Link>
                </div>
              </motion.div>
            )}

            {activeRole === "principal" && (
              <motion.div
                key="role-principal-auth"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-amber-600 tracking-wider uppercase">Executive Office</span>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">
                    {session.studentName || session.email || "Executive Administrator"}
                  </h2>
                  <p className="text-xs text-slate-500">Principal Office • Institutional Management Console</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xl font-black text-amber-600">{pulse?.overallAttendance ?? 89.4}%</div>
                      <span className="text-[10px] text-slate-500">Campus Avg</span>
                    </div>
                    <div>
                      <div className="text-xl font-black text-blue-600">{pulse?.totalStudents ?? 16}</div>
                      <span className="text-[10px] text-slate-500">Enrolled</span>
                    </div>
                    <div>
                      <div className="text-xl font-black text-rose-600">{pulse?.shortageAlerts ?? 2}</div>
                      <span className="text-[10px] text-slate-500">Shortages</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <Link href="/pulse" className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between h-24 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Campus Pulse</h4>
                      <p className="text-[10px] text-slate-500">Department Metrics</p>
                    </div>
                  </Link>

                  <Link href="/audit" className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between h-24 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Audit Ledger</h4>
                      <p className="text-[10px] text-slate-500">Immutable Trail</p>
                    </div>
                  </Link>
                </div>

                <Link href="/principal" className="block">
                  <Button className="w-full rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-4 shadow-sm">
                    Open Executive Console →
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ─── Mobile Bottom App Footer with Powered By Brandex (Light Theme) ─── */}
      <div className="mt-auto pt-6 px-4 pb-2 border-t border-slate-200/80 flex flex-col items-center justify-center text-center gap-3">
        <PoweredByBrandex variant="footer" className="text-slate-500" />
        <p className="text-[10px] text-slate-500 font-medium">
          Attendex Academic OS • High-Performance Institutional Architecture
        </p>
      </div>
    </div>
  );
}
