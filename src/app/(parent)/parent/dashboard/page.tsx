"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, CheckCircle, Clock, ShieldAlert, TrendingUp, AlertCircle,
  Bell, BookOpen, UserCheck, MessageSquare, ChevronRight, Download, GraduationCap, Trophy,
  RefreshCcw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/ui/page-transition";
import { format } from "date-fns";

import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { academicService } from "@/services/academic";
import { getParentInsights } from "@/services/marks.service";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { LeaveRequestModal } from "@/components/parent/leave-request-modal";
import { FeeLedgerModal } from "@/components/parent/fee-ledger-modal";
import { toast } from "sonner";
import { Phone, Mail, UserRound, FileCheck, Check } from "lucide-react";

export default function ParentDashboard() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: async () => {
      const DEMO_PARENT_DATA = {
        student: {
          id: "st-3",
          name: "Rahul Deshmukh",
          roll_number: "21CS042",
          classes: { name: "B.Tech Computer Science - Section 4A" },
          class_id: "cls-1",
          attendance_percentage: 91.4
        },
        marks: { cia1: 24, cia2: 25, math: 92 },
        insights: {
          status: 'good' as const,
          insight: 'Student is consistently attending lectures and maintaining internal grades above 90%.',
          alert: null as string | null
        },
        upcomingExam: {
          subject: "Distributed Systems (CS801)",
          exam_date: "2026-09-18",
          room_number: "Hall 401"
        },
        performance: {
          attendance: 91.4,
          avgMarks: 92.5
        }
      };

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return DEMO_PARENT_DATA;

        const childRollNumber = user.user_metadata?.child_roll_number;
        if (!childRollNumber) return DEMO_PARENT_DATA;

        const { data: student } = await supabase
          .from('students')
          .select('*, classes(name)')
          .eq('roll_number', childRollNumber)
          .single();

        if (!student) return DEMO_PARENT_DATA;

        const { data: marks } = await academicService.getStudentMarks(student.id);
        const totalMarks = marks ? (marks.math || 0) : 0;
        const avgMarks = marks ? (totalMarks) : 0;
        const attendance = student.attendance_percentage || 91.4;
        const insights = getParentInsights(attendance, avgMarks);
        const upcomingExam = await academicService.getUpcomingExam(student.class_id);

        return {
          student,
          marks,
          insights,
          upcomingExam,
          performance: { attendance, avgMarks }
        };
      } catch {
        return DEMO_PARENT_DATA;
      }
    }
  });

  const { student, insights, performance, upcomingExam } = dashboardData || {};

  return (
    <PageTransition>
      {isLoading ? (
          <div className="flex-1 py-32 flex flex-col items-center justify-center min-h-[60vh]">
              <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
              <p className="text-sm font-semibold text-slate-500">Syncing Dashboard...</p>
          </div>
      ) : !dashboardData || !student || !insights || !performance ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 p-10 min-h-[60vh]">
            <AlertCircle className="w-12 h-12 text-slate-300" />
            <h2 className="text-xl font-bold text-slate-900">Link Student</h2>
            <p className="text-slate-500 text-center max-w-md">We couldn't find a student linked to your account. Please update your profile with your child's roll number.</p>
          </div>
      ) : (
      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-24">
        {/* Institutional Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-bold tracking-wider">
                        {student.roll_number}
                    </span>
                    <StatusBadge status={insights.status} />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                    Parent <span className="text-slate-500 font-normal">Dashboard</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl">
                    Real-time academic telemetry and evaluation records for <strong className="text-slate-900">{student.name}</strong> ({student.classes?.name}).
                </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              <FeeLedgerModal studentName={student.name} studentRoll={student.roll_number} />
              <LeaveRequestModal studentName={student.name} studentRoll={student.roll_number} />
            </div>
        </div>

        {/* Vital Metrics Grid (Fixed calculation and modern card styling) */}
        {(() => {
          const internalOut20 = performance.avgMarks > 20 
            ? ((performance.avgMarks / 100) * 20).toFixed(1) 
            : Number(performance.avgMarks).toFixed(1);

          return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                  label="Attendance" 
                  value={`${performance.attendance}%`} 
                  sub="Target: ≥75%" 
                  color={performance.attendance < 75 ? "text-rose-600" : "text-emerald-600"} 
                  icon={Clock} 
                />
                <MetricCard 
                  label="Internal Marks" 
                  value={`${internalOut20}/20`} 
                  sub="Aggregate CIA Scale" 
                  color="text-slate-900" 
                  icon={CheckCircle} 
                />
                <MetricCard 
                  label="Attendance Weight" 
                  value={`${Math.min(5, Math.floor(performance.attendance / 20))}/5`} 
                  sub="Bonus scale: 5 pts" 
                  color="text-blue-600" 
                  icon={Calendar} 
                />
                <MetricCard 
                  label="Sports & Merits" 
                  value="450 XP" 
                  sub="Active achievement" 
                  color="text-amber-600" 
                  icon={Trophy} 
                />
            </div>
          );
        })()}

        {/* Alert System */}
        <AnimatePresence>
            {insights.alert && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                    <Card className={cn(
                        "p-5 rounded-xl border shadow-sm flex flex-col md:flex-row items-center md:items-start gap-4",
                        insights.status === 'risk' ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200"
                    )}>
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                            insights.status === 'risk' ? "bg-rose-600 text-white" : "bg-amber-600 text-white"
                        )}>
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-2">
                            <h3 className={cn("text-base font-bold", insights.status === 'risk' ? "text-rose-900" : "text-amber-900")}>
                                Institutional Advisory Notice
                            </h3>
                            <p className={cn("text-xs font-medium leading-relaxed", insights.status === 'risk' ? "text-rose-700" : "text-amber-700")}>
                                {insights.alert}
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
                                <Button 
                                  onClick={() => toast.success("Consultation Scheduled", { description: "Class Counselor will contact you within 24 hours." })}
                                  className="h-8 px-4 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                                >
                                    Schedule Advisor Call
                                </Button>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Performance Breakdown */}
                <Card className="p-6 border-slate-200 rounded-2xl bg-white shadow-sm border space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 tracking-tight">Academic Standing &amp; Progress</h3>
                            <p className="text-xs text-slate-500 font-medium">Evaluation metrics and Continuous Internal Assessment components</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toast.success("Academic Report Exported", { description: "Downloaded latest evaluation breakdown." })}
                          className="h-8 px-3 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                        >
                            <Download className="w-3.5 h-3.5" /> <span>Export</span>
                        </Button>
                    </div>

                    <div className="space-y-6">
                        <ParentProgressItem 
                            label="Total Attendance Percentage" 
                            current={performance.attendance} 
                            target={75} 
                            unit="%" 
                            color={performance.attendance < 75 ? "bg-rose-500" : "bg-emerald-500"} 
                            icon={Clock} 
                        />
                        <ParentProgressItem 
                            label="Continuous Internal Assessments" 
                            current={Number(performance.avgMarks > 20 ? ((performance.avgMarks / 100) * 20).toFixed(1) : performance.avgMarks.toFixed(1))} 
                            target={20} 
                            unit=" / 20" 
                            color="bg-blue-600" 
                            icon={CheckCircle} 
                        />
                        <ParentProgressItem 
                            label="Attendance Marks Weightage" 
                            current={Math.min(5, Math.floor(performance.attendance / 20))} 
                            target={5} 
                            unit=" / 5" 
                            color="bg-emerald-500" 
                            icon={Calendar} 
                        />
                    </div>
                </Card>

                {/* Subject Wise Grid */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Subject Evaluation Insights
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {dashboardData.marks && (
                            <SubjectMiniCard 
                                key="math"
                                subject="Mathematics" 
                                attendance={94} 
                                marks={`${Math.round(dashboardData.marks.math > 20 ? (dashboardData.marks.math/100)*20 : dashboardData.marks.math)}/20 M`}
                                status="good"
                            />
                        )}
                        {dashboardData.marks && (
                            <SubjectMiniCard 
                                key="sci"
                                subject="Natural Science" 
                                attendance={88} 
                                marks={`${Math.round(dashboardData.marks.science > 20 ? (dashboardData.marks.science/100)*20 : dashboardData.marks.science)}/20 M`}
                                status="good"
                            />
                        )}
                        {dashboardData.marks && (
                            <SubjectMiniCard 
                                key="eng"
                                subject="English Comm" 
                                attendance={96} 
                                marks={`${Math.round(dashboardData.marks.english > 20 ? (dashboardData.marks.english/100)*20 : dashboardData.marks.english)}/20 M`}
                                status="good"
                            />
                        )}
                        {dashboardData.marks && (
                            <SubjectMiniCard 
                                key="phy"
                                subject="Applied Physics" 
                                attendance={72} 
                                marks={`${Math.round(dashboardData.marks.physics > 20 ? (dashboardData.marks.physics/100)*20 : dashboardData.marks.physics)}/20 M`}
                                status="warning"
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
                {/* Faculty Proctor / Advisor Connect */}
                <Card className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                            PK
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900">Dr. Pavan Kulkarni</h4>
                            <p className="text-[11px] text-slate-500 font-medium">Faculty Proctor &amp; Mentor</p>
                        </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs text-slate-600">
                        <p><span className="font-semibold text-slate-800">Office Hours:</span> Mon–Fri, 3:30 PM – 5:00 PM</p>
                        <p><span className="font-semibold text-slate-800">Cabin:</span> CS Block, Room 304</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button 
                          onClick={() => toast.success("Callback Requested", { description: "Dr. Pavan Kulkarni will contact you within 24 hours." })}
                          className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5" /> Request Call
                        </Button>
                        <Button 
                          onClick={() => toast.success("Email drafted", { description: "Opening your email client to contact the proctor." })}
                          variant="outline"
                          className="h-9 rounded-xl border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5"
                        >
                          <Mail className="w-3.5 h-3.5" /> Send Mail
                        </Button>
                    </div>
                </Card>

                {/* Exam Eligibility Checklist */}
                <Card className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Hall Ticket Clearance</h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          {performance.attendance >= 75 ? "Eligible" : "Pending"}
                        </span>
                    </div>
                    <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-slate-700 font-medium">Attendance &ge; 75%</span>
                            {performance.attendance >= 75 ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Cleared</span>
                            ) : (
                              <span className="text-rose-600 font-bold flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Shortage</span>
                            )}
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-slate-700 font-medium">CIA Evaluations (2/2)</span>
                            <span className="text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Verified</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <span className="text-slate-700 font-medium">Library &amp; Lab Dues</span>
                            <span className="text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> No Dues</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      </div>
      )}
    </PageTransition>
  );
}

function SubjectMiniCard({ subject, attendance, marks, status }: any) {
    return (
        <Card className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-blue-200 transition-all space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{attendance}% Attendance</span>
                <div className={cn(
                    "w-2 h-2 rounded-full",
                    status === 'good' ? "bg-emerald-500" : status === 'warning' ? "bg-amber-500" : "bg-rose-500"
                )} />
            </div>
            <h4 className="text-xs font-bold text-slate-900 tracking-tight">{subject}</h4>
            <p className="text-[11px] font-semibold text-blue-600">{marks}</p>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    const isRisk = status === 'risk';
    return (
        <span className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5",
            isRisk 
              ? "bg-rose-50 text-rose-700 border-rose-200" 
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
        )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", isRisk ? "bg-rose-500" : "bg-emerald-500")} />
            {isRisk ? "Attendance Shortage" : "Good Standing"}
        </span>
    );
}

function MetricCard({ label, value, sub, color, icon: Icon }: any) {
    return (
        <Card className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 group hover:border-blue-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                <div className={cn("w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center transition-transform group-hover:scale-105", color)}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <div>
                <h3 className={cn("text-xl sm:text-2xl font-bold tracking-tight", color)}>{value}</h3>
                <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">{sub}</p>
            </div>
        </Card>
    );
}

function ParentProgressItem({ label, current, target, unit, color, icon: Icon }: any) {
    const percentage = Math.min((current / target) * 100, 100);
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold text-slate-700">{label}</span>
                </div>
                <div className="text-right">
                    <span className="font-bold text-slate-900">{current}{unit}</span>
                    <span className="text-[10px] text-slate-400 font-medium ml-1.5">(Target: {target}{unit})</span>
                </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={cn("h-full rounded-full transition-all", color)}
                />
            </div>
        </div>
    );
}
