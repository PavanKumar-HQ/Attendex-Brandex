"use client";

import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { getQrFallbackDataUri } from "@/lib/qr-helper";
import { 
  Activity, 
  Users, 
  CheckCircle, 
  BookOpen, 
  TrendingUp, 
  GraduationCap, 
  FileCheck,
  ClipboardList,
  Trophy,
  RefreshCcw,
  Trophy as TrophyIcon,
  ChevronRight,
  AlertTriangle,
  CalendarDays,
  CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    getStudentPerformance
} from "@/lib/marks-calculations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { academicService } from "@/services/academic";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { projectAttendance } from "@/services/analytics.service";
import { AttendanceCalculator } from "@/components/student/attendance-calculator";
import { HallTicketModal } from "@/components/student/hall-ticket-modal";
import { AssignmentTracker } from "@/components/student/assignment-tracker";
import { useAuth } from "@/lib/auth-context";

import { resolveActiveStudentAsync, resolveActiveStudent, InstitutionalStudent } from "@/lib/student-auth";

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [nextExam, setNextExam] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [projection, setProjection] = useState<any>(null);

  const activeName = (student?.name && student.name !== "Student") 
    ? student.name 
    : (currentUser?.name && currentUser.name !== "Rahul Deshmukh" 
        ? currentUser.name 
        : (typeof window !== "undefined" ? localStorage.getItem("attendex_user_name") || "Student" : "Student"));

  useEffect(() => {
    const loadAcademicPulse = async () => {
      try {
        setLoading(true);
        
        // 1. Resolve Identity from cookie or user metadata
        let rollNumber: string | undefined = undefined;
        try {
          const res = await supabase.auth.getUser();
          rollNumber = res.data?.user?.user_metadata?.roll_number;
        } catch {
          // Ignore
        }

        if (!rollNumber && typeof document !== "undefined") {
          const cookieMatch = document.cookie.match(/attendex_student_roll=([^;]+)/);
          if (cookieMatch) rollNumber = decodeURIComponent(cookieMatch[1]);
        }

        const activeStudent: InstitutionalStudent = await resolveActiveStudentAsync(rollNumber);

        const totalConducted = activeStudent.total_sessions || 60;
        const totalPresent = activeStudent.attended_sessions || Math.round((activeStudent.attendance_percentage / 100) * totalConducted);
        const pct = activeStudent.attendance_percentage;
        const isSafe = pct >= 75.0;

        // Dynamic Safe Skips / Recovery Classes calculation
        const classesNeeded = isSafe ? 0 : Math.max(1, Math.ceil((0.75 * totalConducted - totalPresent) / 0.25));
        const classesCanMiss = isSafe ? Math.max(0, Math.floor((totalPresent - 0.75 * totalConducted) / 0.75)) : 0;

        setStudent({
          id: activeStudent.id,
          name: activeStudent.name,
          roll: activeStudent.roll_number,
          registerNumber: activeStudent.register_number,
          class_id: "cls-1",
          className: activeStudent.class_name,
          attendancePercentage: pct,
          cgpa: activeStudent.cgpa,
          dob: activeStudent.formatted_dob
        });

        setProjection({
          currentPercentage: pct,
          status: isSafe ? "Safe" : "Shortage Warning",
          classesNeededFor75: classesNeeded,
          classesCanMiss: classesCanMiss,
          confidence: isSafe ? "High" : "Urgent Attention Required"
        });

        setNextExam({
          subject: "Distributed Systems & Cloud (CS801)",
          exam_date: "2026-09-18",
          room_number: "LH-401"
        });

        setPerformance({
          totalMarks: Number((activeStudent.cgpa * 10).toFixed(1)),
          grade: activeStudent.cgpa >= 9.0 ? "O (Outstanding)" : activeStudent.cgpa >= 8.0 ? "A+ (Excellent)" : "B+ (Good)",
          status: isSafe ? "Good Academic Standing" : "Attendance Shortage Defaulter",
          attendanceWeighted: Number((pct / 10).toFixed(1)),
          ciaScore: Number((activeStudent.cgpa * 5).toFixed(1))
        });

        setLoading(false);
      } catch (err) {
        const fallback = resolveActiveStudent();
        setStudent({
          id: fallback.id,
          name: fallback.name,
          roll: fallback.roll_number,
          className: fallback.class_name,
          attendancePercentage: fallback.attendance_percentage,
          cgpa: fallback.cgpa
        });
        setLoading(false);
      }
    };

    loadAcademicPulse();
  }, []);

  const daysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Loading state moved inline

  const isEligible = (student?.attendancePercentage || 0) >= 75;

  return (
    <PageTransition>
      <div className="flex flex-col min-h-full pb-20 max-w-7xl mx-auto px-6">
        <header className="py-6 sm:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 mb-6 sm:mb-8">
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 shrink-0">
                    <GraduationCap className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                      Welcome back, <span className="text-blue-600">{activeName}</span>! 👋
                    </h1>
                    <p className="text-slate-500 font-medium text-xs sm:text-sm mt-0.5 truncate">
                      Institutional Academic Portal • {student?.className || "Computer Science & Engineering"}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                <HallTicketModal studentName={activeName} rollNumber={student?.roll} branch={student?.className} />
                <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-slate-900">{student?.roll || "CS-11"}</p>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/80 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Verified Active
                    </div>
                </div>
            </div>
        </header>

        {loading ? (
            <div className="py-24 flex flex-col items-center justify-center">
                <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-sm font-semibold text-slate-500">Loading Student Profile...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
            {/* 🚩 ELIGIBILITY & EXAM GATE 🚩 */}
            <AnimatePresence mode="popLayout">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className={cn(
                        "p-6 sm:p-8 rounded-3xl border-none text-white relative overflow-hidden shadow-2xl transition-all min-h-[300px] h-auto flex flex-col justify-between",
                        isEligible ? "bg-slate-900" : "bg-red-950"
                    )}>
                        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />
                        
                        <div className="flex flex-col-reverse sm:flex-row justify-between items-start gap-6 relative z-10">
                            <div className="space-y-3.5 flex-1 min-w-0">
                                <div className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-xs",
                                    isEligible ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                )}>
                                    {isEligible ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                                    {isEligible ? `Attendance Status: Good (${(student?.attendancePercentage || 94.2).toFixed(1)}%)` : `Attendance Shortage (${(student?.attendancePercentage || 68).toFixed(1)}%)`}
                                </div>
                                <div>
                                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                                      {isEligible ? "Hall Ticket Active" : "Examination Access Blocked"}
                                  </h2>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed font-medium">
                                    {isEligible 
                                        ? (projection?.safeBuffer === 0 
                                            ? "You are currently meeting the 75% threshold. Maintain regular attendance to keep your hall ticket active."
                                            : `You are on track. Safe buffer: You can miss up to ${projection?.safeBuffer || 1} lecture${(projection?.safeBuffer || 1) > 1 ? 's' : ''} while maintaining hall ticket eligibility.`
                                          )
                                        : `Critical shortage. You must attend at least ${projection?.targetRemaining || 1} more lecture${(projection?.targetRemaining || 1) > 1 ? 's' : ''} to reach 75% eligibility.`
                                    }
                                </p>
                            </div>

                            {isEligible && (
                                <div className="bg-white p-3 sm:p-3.5 rounded-2xl shadow-2xl shrink-0 self-start sm:self-center border border-white/20">
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-50 rounded-xl flex items-center justify-center p-1">
                                        <img 
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=STU-${student?.roll || 'CS-11'}`} 
                                            alt="QR" 
                                            className="w-full h-full object-contain mix-blend-multiply"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = getQrFallbackDataUri(`STU-${student?.roll || 'CS-11'}`);
                                            }}
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-700 text-center uppercase tracking-wider mt-1.5">Official Token</p>
                                </div>
                            )}
                        </div>

                        <div className="relative z-10 flex flex-wrap items-center gap-4 sm:gap-8 bg-white/5 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-white/10 mt-6 sm:mt-8">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Upcoming Milestone</p>
                                <p className="text-sm sm:text-base font-bold truncate">{nextExam?.subject || "Check Notice Board"}</p>
                            </div>
                            <div className="hidden sm:block w-px h-8 bg-white/15" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Room Assignment</p>
                                <p className="text-sm sm:text-base font-bold">{nextExam?.room_number || "Hall 401"}</p>
                            </div>
                            {nextExam && (
                                <>
                                    <div className="hidden sm:block w-px h-8 bg-white/15" />
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-xl sm:text-2xl font-black text-blue-400">{daysUntil(nextExam.exam_date)}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Left</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                </motion.div>
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard title="Total Presence" value={`${student?.attendancePercentage ? student.attendancePercentage.toFixed(1) : "91.4"}%`} color="bg-blue-600" icon={CheckCircle} delay={0.2} />
                <StatCard title="Sports & Merit Points" value="450 XP" color="bg-orange-500" icon={Trophy} delay={0.3} />
            </div>

            {/* Attendance Margin Calculator */}
            <AttendanceCalculator currentPresent={42} currentTotal={46} />

            {/* Academic Performance */}
            <Card className="p-6 md:p-8 rounded-2xl bg-white shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Academic CIA Performance</h3>
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="space-y-6">
                    <BreakdownItem label="Regularity & Attendance Marks" value={performance?.attendanceMarks || 5} max={5} color="bg-blue-600" />
                    <BreakdownItem label="CIA Continuous Assessments" value={performance?.ciaTotal || 4.5} max={5} color="bg-indigo-500" />
                    <BreakdownItem label="Technical Theory Tests" value={performance?.testScore || 9} max={10} color="bg-slate-900" />
                </div>
            </Card>

            {/* Assignment & Lab Submissions */}
            <AssignmentTracker />
          </div>

          <div className="lg:col-span-4 space-y-8">
            <Card className="p-8 rounded-2xl bg-slate-50 shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
                <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Notice Feed</h3>
                <div className="space-y-6 flex-1">
                    <AlertItem title="System Active" time="Day 1/3" color="blue" />
                    <AlertItem title="Hall Ticket Window" time="Closing Soon" color="amber" />
                    <AlertItem title="System Update" time="L4 Cancelled" color="rose" />
                </div>
                
                <div className="mt-auto pt-8">
                    <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
                        <div className={cn(
                            "w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center",
                            isEligible ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                        )}>
                            <TrophyIcon className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-900 mb-1">Exam Hall Ticket</p>
                        <p className="text-xs font-medium text-slate-500 leading-relaxed">
                            {isEligible ? "Your digital entry token is active" : "Blocked due to low attendance"}
                        </p>
                    </div>
                </div>
            </Card>
          </div>
            </div>
        )}
      </div>
    </PageTransition>
  );
}

function AlertItem({ title, time, color }: any) {
    const colorMap: any = {
        blue: "bg-blue-500",
        amber: "bg-amber-500",
        rose: "bg-rose-500"
    };
    return (
        <div className="flex items-center gap-4 group cursor-default">
            <div className={cn("w-2 h-2 rounded-full", colorMap[color])} />
            <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 tracking-tight">{title}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{time}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.3 }}
        >
            <Card className="p-6 border-slate-200 shadow-sm rounded-2xl bg-white group hover:shadow-md hover:border-blue-200 transition-all border">
                <div className="flex items-center justify-between">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105", color)}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

function BreakdownItem({ label, value, max, color }: any) {
    const percentage = ((value || 0) / max) * 100;
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="text-slate-900">{label}</span>
                <span className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">{value} / {max}</span>
            </div>
            <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={cn("h-full rounded-full transition-all duration-1000", color)}
                />
            </div>
        </div>
    );
}

function AssignmentRow({ title, marks, status }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50/50 transition-colors border border-transparent hover:border-slate-100">
            <div>
                <p className="text-sm font-bold text-slate-700">{title}</p>
                <p className={cn("text-[10px] font-bold uppercase", status === 'Graded' ? 'text-emerald-500' : 'text-slate-400')}>{status}</p>
            </div>
            <div className="text-sm font-bold text-slate-900">{marks}</div>
        </div>
    );
}
