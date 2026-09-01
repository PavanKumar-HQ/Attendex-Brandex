"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Users,
  BarChart3,
  Mail,
  Trophy,
  BookOpen,
  Medal,
  Calendar,
  GraduationCap,
  Building2,
  Lock,
  TrendingUp,
  CheckCheck,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"faculty" | "student" | "parent">("faculty");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 flex flex-col font-sans">
      {/* Institutional Top Notification Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 text-center font-medium border-b border-slate-800 flex items-center justify-center gap-2">
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
          v2.4 Academic Release
        </span>
        <span>Unified Attendance, Continuous Internal Assessment (CIA) & Parent Gateway</span>
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                Attendex
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  EDU
                </span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#overview" className="hover:text-slate-900 transition-colors">Overview</a>
            <a href="#interactive-preview" className="hover:text-slate-900 transition-colors">Portals & Preview</a>
            <a href="#modules" className="hover:text-slate-900 transition-colors">Academic Modules</a>
            <a href="#security" className="hover:text-slate-900 transition-colors">Compliance & Security</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold px-4 shadow-sm flex items-center gap-1.5">
                <span>Enter Demo</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="overview" className="pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-semibold mb-8 shadow-sm">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Built for Modern Universities, Colleges & Schools</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
            Institutional Attendance & <br className="hidden sm:block" />
            <span className="text-blue-600">Academic Intelligence</span> System.
          </h1>

          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed font-normal">
            Eliminate manual registers. Manage daily classroom attendance, track Continuous Internal Assessment (CIA) marks, and notify parents automatically.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/dashboard" 
              onClick={() => { document.cookie = "attendex_demo_session=TEACHER; path=/; max-age=86400; SameSite=Lax"; }}
              className="w-full sm:w-auto"
            >
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm flex items-center justify-center gap-2">
                <span>Launch Faculty Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link 
              href="/student/dashboard" 
              onClick={() => { document.cookie = "attendex_demo_session=STUDENT; path=/; max-age=86400; SameSite=Lax"; }}
              className="w-full sm:w-auto"
            >
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-sm font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg">
                View Student Portal
              </Button>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-14 pt-10 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">94.8%</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +2.4% this semester
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sync Speed</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">&lt; 300ms</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Real-time DB updates</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Enrollment</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">12,400+</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Verified student profiles</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Parent Dispatch</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">99.9%</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" /> Automated notifications
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Interactive Portal Showcase */}
      <section id="interactive-preview" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Unified Multi-Portal Architecture</span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Tailored Experiences for Every Stakeholder</h2>
            <p className="text-slate-600 text-sm">Select a role below to preview how Attendex simplifies everyday academic operations.</p>
          </div>

          {/* Interactive Role Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab("faculty")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all",
                  activeTab === "faculty" ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Faculty & Admin Portal</span>
              </button>
              <button
                onClick={() => setActiveTab("student")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all",
                  activeTab === "student" ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Student Academic View</span>
              </button>
              <button
                onClick={() => setActiveTab("parent")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all",
                  activeTab === "parent" ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Parent Risk Monitor</span>
              </button>
            </div>
          </div>

          {/* Tab Screen Previews */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
            {activeTab === "faculty" && (
              <motion.div
                key="faculty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Faculty Command Center</h3>
                    <p className="text-xs text-slate-500">Live attendance sessions, Continuous Internal Assessment & class rosters</p>
                  </div>
                  <Link href="/dashboard">
                    <Button size="sm" className="bg-slate-900 text-white text-xs font-semibold rounded-lg">
                      Open Live Faculty Dashboard →
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">CS-302: Operating Systems</span>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                        Session Active
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-slate-900">58 / 62</p>
                        <p className="text-xs text-slate-500">Students Marked Present</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-600">93.5%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: "93.5%" }} />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">CIA Marks Entry Status</span>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        Test 1 Completed
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>Database Systems</span>
                        <span className="font-semibold text-slate-900">Avg: 23.4 / 25</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>Algorithms & Complexity</span>
                        <span className="font-semibold text-slate-900">Avg: 21.8 / 25</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Automated Audit Log</span>
                      <span className="text-[10px] font-medium text-slate-400">Past 1 hour</span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>Prof. Sharma finalized Attendance for Section 4B</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>8 Parent SMS alerts delivered for absent roll numbers</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "student" && (
              <motion.div
                key="student"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Student Progress & Marks Dashboard</h3>
                    <p className="text-xs text-slate-500">Attendance percentages, Continuous Assessment scores & eligibility radar</p>
                  </div>
                  <Link 
                    href="/student/dashboard"
                    onClick={() => { document.cookie = "attendex_demo_session=STUDENT; path=/; max-age=86400; SameSite=Lax"; }}
                  >
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg">
                      Open Student Portal →
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase">Overall Attendance</p>
                    <h4 className="text-3xl font-extrabold text-slate-900 mt-2">88.5%</h4>
                    <p className="text-xs text-emerald-600 font-medium mt-1">✓ Safe: Above 75% Exam Criterion</p>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
                      <span>Classes Attended</span>
                      <span className="font-semibold text-slate-800">142 / 160</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase">CIA Grade Estimate</p>
                    <h4 className="text-3xl font-extrabold text-slate-900 mt-2">A+ (91.2%)</h4>
                    <p className="text-xs text-blue-600 font-medium mt-1">Top 5% in Department</p>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
                      <span>Internal Credit Points</span>
                      <span className="font-semibold text-slate-800">48.5 / 50</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase">Class Schedule Today</p>
                    <div className="mt-2 space-y-2 text-xs">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                        <span className="font-medium text-slate-800">10:00 AM • Data Structures</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Present</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                        <span className="font-medium text-slate-800">02:00 PM • Computer Networks</span>
                        <span className="text-[10px] font-medium text-slate-500">Upcoming</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "parent" && (
              <motion.div
                key="parent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Guardian Transparency Portal</h3>
                    <p className="text-xs text-slate-500">Instant notification history, attendance status, and risk analysis</p>
                  </div>
                  <Link 
                    href="/parent/dashboard"
                    onClick={() => { document.cookie = "attendex_demo_session=PARENT; path=/; max-age=86400; SameSite=Lax"; }}
                  >
                    <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg">
                      Open Parent View →
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold text-slate-500 uppercase">Student Standing</span>
                    <h4 className="text-lg font-bold text-slate-900 mt-2">Rahul Deshmukh (Roll #21)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">B.Tech CS • Semester 4</p>
                    <div className="mt-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                      ✓ Good Standing: No academic deficiency detected.
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold text-slate-500 uppercase">Attendance Record</span>
                    <h4 className="text-2xl font-bold text-slate-900 mt-2">89.2%</h4>
                    <p className="text-xs text-slate-500 mt-1">2 Absences recorded this month</p>
                    <div className="mt-3 text-xs text-slate-600 space-y-1">
                      <p>• Aug 28: Absent (Sick Leave Approved)</p>
                      <p>• Aug 14: Absent (Sports Duty)</p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold text-slate-500 uppercase">Message Log</span>
                    <div className="mt-2 space-y-2 text-xs">
                      <div className="p-2 bg-slate-50 rounded border border-slate-100">
                        <span className="font-semibold text-slate-900">SMS Notice:</span> Mid-Term Exam Marks Published.
                        <p className="text-[10px] text-slate-400 mt-0.5">Sent yesterday at 4:30 PM</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-100">
                        <span className="font-semibold text-slate-900">Parent-Teacher Meeting:</span> Scheduled for Sept 15.
                        <p className="text-[10px] text-slate-400 mt-0.5">Sent on Aug 25</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Academic Modules Grid */}
      <section id="modules" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Comprehensive Capability</span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Structured for Academic Administration</h2>
          <p className="text-slate-600 text-base font-normal">Everything needed to run department rosters, evaluations, and compliance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-all rounded-xl">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 border border-blue-100">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Live Class Attendance</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Take attendance per lecture or session in under 30 seconds. Supports quick toggle, RFID, biometric sync, and offline persistence.
            </p>
          </Card>

          <Card className="p-6 border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-all rounded-xl">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4 border border-indigo-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">CIA Marks & Gradebook</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter Continuous Internal Assessment marks, assignments, and practicals. Automated formula calculation for final semester eligibility.
            </p>
          </Card>

          <Card className="p-6 border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-all rounded-xl">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4 border border-emerald-100">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Parent SMS & Email Dispatch</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Trigger automated daily notifications to guardians when students fall below mandatory thresholds or miss critical lectures.
            </p>
          </Card>

          <Card className="p-6 border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-all rounded-xl">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-4 border border-amber-100">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Academic Leaderboards</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Recognize top academic performers and consistent attendance streaks across departments with verified badges and rankings.
            </p>
          </Card>

          <Card className="p-6 border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-all rounded-xl">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4 border border-purple-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">One-Click PDF & Excel Reports</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Export official university formatted attendance sheets, eligibility lists, and department audit registers in seconds.
            </p>
          </Card>

          <Card className="p-6 border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-all rounded-xl">
            <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center mb-4 border border-slate-200">
              <Medal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Sports & Co-Curricular Points</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Track university athletics, cultural events, and inter-college tournament participations with official point weighting.
            </p>
          </Card>
        </div>
      </section>

      {/* Compliance & Security Section */}
      <section id="security" className="py-16 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-blue-400 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Institutional Data Security
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Compliant, Isolated & Fully Auditable.
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Attendex adheres to university data protection standards. All grade entries and attendance modifications are recorded with timestamped audit logs.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-400" />
                    Role-Based Access (RBAC)
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Strict isolation between Faculty, Students, and Administration.</p>
                </div>
                <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Immutable Audit Trail
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Every mark alteration and attendance override is tracked.</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700 text-slate-400">
                <span>institutional_audit.json</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">VERIFIED</span>
              </div>
              <pre className="text-slate-300 overflow-x-auto leading-relaxed pt-2">
{`{
  "system": "Attendex Educational Core",
  "audit_version": "2026.4",
  "encryption": "AES-256 GCM at Rest",
  "compliance": ["FERPA-Standard", "ISO-27001 Ready"],
  "tenant_isolation": "Row-Level Security (RLS) Active",
  "session_guard": "Passkey & Multi-factor Verified"
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm">Attendex Academic Systems</span>
              <p className="text-[11px] text-slate-500">© 2026 Attendex. Standard Academic License.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 font-medium text-slate-600">
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">Admin Portal</Link>
            <Link href="/student/dashboard" className="hover:text-slate-900 transition-colors">Student View</Link>
            <Link href="/parent/dashboard" className="hover:text-slate-900 transition-colors">Parent View</Link>
            <Link href="/login" className="hover:text-slate-900 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
