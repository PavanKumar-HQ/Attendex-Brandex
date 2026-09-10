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
import { MobileAppShowcase } from "@/components/mobile/mobile-app-showcase";
import { PoweredByBrandex } from "@/components/ui/powered-by-brandex";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"faculty" | "student" | "parent">("faculty");
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/attendex_demo_session=([^;]+)/);
      if (match) {
        setIsLoggedIn(true);
        setUserRole(decodeURIComponent(match[1]).toLowerCase());
      }
    }
  }, []);

  return (
    <>
      {/* ─── Mobile View: Fully-Fledged Native App Experience (Zero Overflow) ─── */}
      <div className="block md:hidden w-full max-w-full overflow-x-hidden">
        <MobileAppShowcase />
      </div>

      {/* ─── Desktop View: Institutional Portal ─── */}
      <div className="hidden md:flex min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 flex-col font-sans overflow-x-hidden max-w-full">
        {/* Institutional Top Notification Bar */}
        <div className="bg-slate-100 text-slate-700 text-xs py-2 px-4 text-center font-medium border-b border-slate-200 flex items-center justify-center gap-2">
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
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
            {isLoggedIn ? (
              <Link 
                href={userRole === "student" ? "/student/dashboard" : userRole === "parent" ? "/parent/dashboard" : userRole === "principal" ? "/principal" : "/dashboard"}
                className="w-full sm:w-auto"
              >
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center justify-center gap-2">
                  <span>Continue to Your Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm flex items-center justify-center gap-2">
                    <span>Access Institutional Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/login?role=student" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-sm font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg">
                    Student Sign-In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Quick Institutional Capabilities Bar (Zero Fake Data) */}
          <div className="mt-14 pt-10 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classroom Roll-Call</p>
              <h3 className="text-base font-bold text-slate-900 mt-1">Period 1–6 Marking</h3>
              <p className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Biometric &amp; Web Sync
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sync Latency</p>
              <h3 className="text-base font-bold text-slate-900 mt-1">&lt; 300ms Real-Time</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">PostgreSQL replication</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shortage Prevention</p>
              <h3 className="text-base font-bold text-slate-900 mt-1">75% Policy Engine</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Debarment avoidance
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Multi-Platform</p>
              <h3 className="text-base font-bold text-slate-900 mt-1">Offline-Ready PWA</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5" /> iOS, Mac, Win &amp; Android
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
                    <p className="text-xs text-slate-500">Classroom roll-call execution, Continuous Assessment (CIA) &amp; student registries</p>
                  </div>
                  <Link href={isLoggedIn ? "/dashboard" : "/login?role=teacher"}>
                    <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg">
                      {isLoggedIn ? "Open Faculty Dashboard →" : "Sign In to Faculty Console →"}
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Period Roll-Call Execution</span>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        Periods 1–6
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Classroom Marking Terminal</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        One-click roll call with automatic student tallying, RFID integration, and immediate SMS dispatch for absent students.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-blue-600">
                      <CheckCircle2 className="w-4 h-4" /> Real-time database sync
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">CIA Evaluation Ledger</span>
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                        Gradebook
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Continuous Assessment</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Input Test 1, Test 2, assignment, and lab marks. System automatically computes weighted 20-scale aggregates and grade tiers.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-indigo-600">
                      <BookOpen className="w-4 h-4" /> University schema compliant
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Audit &amp; Compliance</span>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                        Automated
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Pattern Verification</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Monitors consecutive session patterns, post-lunch departures, and generates immutable logs for accreditation audits.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-600">
                      <ShieldCheck className="w-4 h-4" /> Tamper-proof verification
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
                    <h3 className="text-lg font-bold text-slate-900">Student Academic Portal</h3>
                    <p className="text-xs text-slate-500">Attendance percentages, Continuous Assessment scores &amp; exam eligibility radar</p>
                  </div>
                  <Link href={isLoggedIn ? "/student/dashboard" : "/login?role=student"}>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg">
                      {isLoggedIn ? "Open Student Portal →" : "Sign In to Student View →"}
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Attendance Safety Radar</span>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        75% Policy
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Safe Margin Calculator</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Interactive simulator calculates exactly how many classes you can afford to skip or must attend to maintain semester exam eligibility.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-blue-600">
                      <ShieldCheck className="w-4 h-4" /> Instant debarment avoidance
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Evaluation Records</span>
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                        Marks Digest
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Continuous CIA Ledger</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Transparent, itemized breakdown of internal assessment marks, assignments, and test weightages for each enrolled subject.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-indigo-600">
                      <BookOpen className="w-4 h-4" /> Downloadable PDF report
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Campus Entry &amp; Exit</span>
                      <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                        Digital Nonce
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">QR Gatepass &amp; Hall Ticket</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Request official out-pass slips with cryptographic nonces for security gate scans, and download university exam hall passes.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-purple-600">
                      <CheckCircle2 className="w-4 h-4" /> Paperless digital verification
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
                    <p className="text-xs text-slate-500">Direct absence notifications, attendance verification, and faculty advisory</p>
                  </div>
                  <Link href={isLoggedIn ? "/parent/dashboard" : "/login?role=parent"}>
                    <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg">
                      {isLoggedIn ? "Open Parent View →" : "Sign In to Guardian Portal →"}
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Academic Standing</span>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                        Real-Time
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Ward Attendance History</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Detailed session-by-session ledger tracking every attended and missed lecture, cross-verified with institutional timekeeping.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Daily SMS and push relays
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Faculty Communication</span>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        Advisory Hub
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Proctor Consultations</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Schedule direct advisory sessions with your child's assigned faculty proctor, track remarks, and monitor developmental progress.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-blue-600">
                      <Users className="w-4 h-4" /> Collaborative student care
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Administrative Desk</span>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                        Financial &amp; Medical
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Fees &amp; Leave Ledger</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Submit medical exemption requests with documentation, view tuition fee receipts, and download certified academic progress digests.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-amber-600">
                      <ShieldCheck className="w-4 h-4" /> Direct administrative routing
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

      {/* Compliance & Security Section (Light Theme) */}
      <section id="security" className="py-16 bg-slate-100/70 text-slate-900 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-200 rounded text-blue-700 text-xs font-semibold shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Institutional Data Security
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                Compliant, Isolated & Fully Auditable.
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Attendex adheres to university data protection standards. All grade entries and attendance modifications are recorded with timestamped audit logs.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600" />
                    Role-Based Access (RBAC)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">Strict isolation between Faculty, Students, and Administration.</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Immutable Audit Trail
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">Every mark alteration and attendance override is tracked.</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 text-xs font-mono space-y-2 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
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
      <footer className="bg-white border-t border-slate-200 py-10 px-6 text-slate-600 text-xs">
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

          {/* Desktop Footer: Powered by Brandex with exact logo image */}
          <PoweredByBrandex variant="footer" />

          <div className="flex items-center gap-6 font-medium text-slate-600">
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">Admin Portal</Link>
            <Link href="/student/dashboard" className="hover:text-slate-900 transition-colors">Student View</Link>
            <Link href="/parent/dashboard" className="hover:text-slate-900 transition-colors">Parent View</Link>
            <Link href="/login" className="hover:text-slate-900 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  </>
);
}
