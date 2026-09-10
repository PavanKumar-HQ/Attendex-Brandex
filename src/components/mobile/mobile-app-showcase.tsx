"use client";

import { useState } from "react";
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
  UserCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PoweredByBrandex } from "@/components/ui/powered-by-brandex";

export function MobileAppShowcase() {
  const [activeRole, setActiveRole] = useState<"student" | "faculty" | "parent" | "principal">("student");

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-10">
      {/* ─── Top Native Mobile App Bar ─── */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">Attendex</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                APP
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">Global Institute of Tech (GITE)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/notifications" className="relative p-2 rounded-xl bg-slate-800/80 text-slate-300 active:scale-95 transition-transform">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-950 animate-pulse" />
          </Link>
          <Link href="/login">
            <Button size="sm" variant="outline" className="h-8 text-xs border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700 rounded-xl px-2.5">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* ─── App Role Selector Segment ─── */}
      <div className="px-4 pt-3 pb-2 w-full max-w-full overflow-x-hidden">
        <div className="p-1 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-1 text-xs">
          {(["student", "faculty", "parent", "principal"] as const).map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`flex-1 py-1.5 px-1 rounded-xl font-semibold capitalize text-[11px] transition-all touch-manipulation ${
                activeRole === role
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {role === "faculty" ? "Teacher" : role}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Main Dynamic App Screen ─── */}
      <div className="flex-1 px-4 py-2 space-y-4 w-full max-w-full overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeRole === "student" && (
            <motion.div
              key="role-student"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Student Header Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/70 via-slate-900 to-indigo-950/60 border border-blue-500/20 shadow-lg relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase">Enrolled Student</span>
                    <h2 className="text-base font-bold text-white mt-0.5">Rahul Deshmukh</h2>
                    <p className="text-xs text-slate-400">21CS042 • B.Tech CSE (4A)</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-400 tracking-tight">91.4%</div>
                    <span className="text-[10px] font-medium text-emerald-300/80">Attendance</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Safe Standing (+3 Skips)</span>
                  </div>
                  <Link href="/student/dashboard" className="text-blue-400 font-semibold text-xs flex items-center gap-1 hover:underline">
                    <span>Open Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Next Class Widget */}
              <div className="p-3.5 rounded-2xl bg-slate-850/90 border border-slate-800 flex items-center justify-between gap-3 bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Today • 10:00 AM</span>
                    <h4 className="text-xs font-bold text-white">Distributed Systems (CS401)</h4>
                    <p className="text-[11px] text-slate-400">Dr. Pavan Kulkarni • Room 302</p>
                  </div>
                </div>
                <Link href="/student/timetable">
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-400 hover:text-blue-300 p-0">
                    Schedule
                  </Button>
                </Link>
              </div>

              {/* Native Quick Action Grid */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
                  App Actions
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <Link href="/student/gatepass" className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-blue-500/40 active:scale-[0.98] transition-all flex flex-col justify-between h-24">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Digital Gatepass</h4>
                      <p className="text-[10px] text-slate-400">Instant QR Nonce</p>
                    </div>
                  </Link>

                  <Link href="/student/marks" className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-blue-500/40 active:scale-[0.98] transition-all flex flex-col justify-between h-24">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">CIA Marks & SGPA</h4>
                      <p className="text-[10px] text-slate-400">Continuous Evaluation</p>
                    </div>
                  </Link>

                  <Link href="/student/timetable" className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-blue-500/40 active:scale-[0.98] transition-all flex flex-col justify-between h-24">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Lecture Timetable</h4>
                      <p className="text-[10px] text-slate-400">Class & Lab Rooms</p>
                    </div>
                  </Link>

                  <Link href="/student/assignments" className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-blue-500/40 active:scale-[0.98] transition-all flex flex-col justify-between h-24">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Coursework & Labs</h4>
                      <p className="text-[10px] text-slate-400">Submit Assignments</p>
                    </div>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {activeRole === "faculty" && (
            <motion.div
              key="role-faculty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-lg">
                <span className="text-[10px] font-semibold text-indigo-400 tracking-wider uppercase">Faculty Command</span>
                <h2 className="text-base font-bold text-white mt-0.5">Prof. Arvind Sharma</h2>
                <p className="text-xs text-slate-400">HOD Computer Science • Section CS-A / CS-B</p>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                  <Link href="/attendance" className="flex-1">
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30">
                      Take Attendance
                    </Button>
                  </Link>
                  <Link href="/results/manage" className="flex-1">
                    <Button size="sm" variant="outline" className="w-full border-slate-700 bg-slate-800/80 text-white rounded-xl text-xs font-bold">
                      Enter CIA Marks
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Link href="/attendance" className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-24">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Roll-Call Session</h4>
                    <p className="text-[10px] text-slate-400">Period 1–6 Marking</p>
                  </div>
                </Link>

                <Link href="/results/manage" className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-24">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">CIA Evaluation</h4>
                    <p className="text-[10px] text-slate-400">Continuous Grading</p>
                  </div>
                </Link>

                <Link href="/students" className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-24">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Student Roster</h4>
                    <p className="text-[10px] text-slate-400">Fuzzy Search & CRUD</p>
                  </div>
                </Link>

                <Link href="/pulse" className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-24">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Campus Pulse</h4>
                    <p className="text-[10px] text-slate-400">Real-time Telemetry</p>
                  </div>
                </Link>
              </div>

              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full rounded-2xl border-slate-800 text-xs font-semibold py-4 text-slate-300">
                  Launch Desktop Faculty Command Center →
                </Button>
              </Link>
            </motion.div>
          )}

          {activeRole === "parent" && (
            <motion.div
              key="role-parent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/20 shadow-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">Guardian Gateway</span>
                    <h2 className="text-base font-bold text-white mt-0.5">Aarav Sharma (Ward)</h2>
                    <p className="text-xs text-slate-400">Roll: CS-11 • Section: CS-A</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-400 tracking-tight">94.0%</div>
                    <span className="text-[10px] font-medium text-slate-400">Present Rate</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-300 text-[11px]">Clean Standing (Grade A+)</span>
                  <Link href="/parent/dashboard" className="text-emerald-400 font-semibold text-xs flex items-center gap-1 hover:underline">
                    <span>Full Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Link href="/parent/leave" className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-24">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Apply Leave</h4>
                    <p className="text-[10px] text-slate-400">Medical / Emergency</p>
                  </div>
                </Link>

                <Link href="/parent/proctor" className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-24">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Book Proctor</h4>
                    <p className="text-[10px] text-slate-400">Faculty Consultation</p>
                  </div>
                </Link>

                <Link href="/parent/fees" className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-24">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Fee Receipts</h4>
                    <p className="text-[10px] text-slate-400">Sem 4 Paid • Clean</p>
                  </div>
                </Link>

                <Link href="/parent/history" className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-24">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Attendance Log</h4>
                    <p className="text-[10px] text-slate-400">Day-by-Day Timeline</p>
                  </div>
                </Link>
              </div>
            </motion.div>
          )}

          {activeRole === "principal" && (
            <motion.div
              key="role-principal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border border-amber-500/30 shadow-lg">
                <span className="text-[10px] font-semibold text-amber-400 tracking-wider uppercase">Executive Office</span>
                <h2 className="text-base font-bold text-white mt-0.5">Dr. K. S. Prabhakar</h2>
                <p className="text-xs text-slate-400">Principal • Executive Overview</p>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-xl font-black text-amber-400">89.4%</div>
                    <span className="text-[10px] text-slate-400">Campus Avg</span>
                  </div>
                  <div>
                    <div className="text-xl font-black text-blue-400">16</div>
                    <span className="text-[10px] text-slate-400">Enrolled</span>
                  </div>
                  <div>
                    <div className="text-xl font-black text-rose-400">2</div>
                    <span className="text-[10px] text-slate-400">Shortage</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Link href="/pulse" className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-24">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Campus Pulse</h4>
                    <p className="text-[10px] text-slate-400">Department Metrics</p>
                  </div>
                </Link>

                <Link href="/audit" className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-24">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Audit Ledger</h4>
                    <p className="text-[10px] text-slate-400">Immutable Trail</p>
                  </div>
                </Link>
              </div>

              <Link href="/principal" className="block">
                <Button className="w-full rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-4 shadow-lg shadow-amber-600/30">
                  Open Executive Console →
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Mobile Bottom App Footer with Powered By Brandex ─── */}
      <div className="mt-auto pt-6 px-4 pb-4 border-t border-slate-800/80 flex flex-col items-center justify-center text-center gap-3">
        <PoweredByBrandex variant="footer" className="text-slate-400" />
        <p className="text-[10px] text-slate-500">
          Attendex Academic OS • High-Performance Institutional Architecture
        </p>
      </div>
    </div>
  );
}
