"use client";

import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  XSquare, 
  Download, 
  RotateCcw, 
  FileCheck2,
  Phone,
  ShieldCheck,
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { LeaveRequestModal } from "@/components/parent/leave-request-modal";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LectureLog {
  date: string;
  day: string;
  dayNum: number;
  total: string;
  status: string;
  classes: {
    name: string;
    time: string;
    status: string;
    code: string;
  }[];
}

export default function ParentHistoryPage() {
  const [selectedDayNum, setSelectedDayNum] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LectureLog[]>([]);
  const [studentInfo, setStudentInfo] = useState({
    name: "Rahul Deshmukh",
    rollNumber: "21CS042",
    attendancePercentage: 91.4
  });

  useEffect(() => {
    async function loadAttendanceHistory() {
      try {
        setLoading(true);
        // Find ward student
        const { data: { user } } = await supabase.auth.getUser();
        let studentId = "";
        if (user) {
          const { data: st } = await supabase
            .from('students')
            .select('id, name, roll_number, attendance_percentage')
            .single();
          if (st) {
            studentId = st.id;
            setStudentInfo({
              name: st.name || "Rahul Deshmukh",
              rollNumber: st.roll_number || "21CS042",
              attendancePercentage: Number(st.attendance_percentage || 91.4)
            });
          }
        }

        // Fetch recent attendance records
        const { data: attRecords, error } = await supabase
          .from('attendance_records')
          .select('*, attendance_sessions(session_date, start_time, end_time, subject_id, subjects(name, code))')
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && attRecords && attRecords.length > 0) {
          // Group by date
          const groups: { [dateStr: string]: any[] } = {};
          attRecords.forEach((rec: any) => {
            const dateStr = rec.attendance_sessions?.session_date || new Date().toISOString().split('T')[0];
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(rec);
          });

          const formatted: LectureLog[] = Object.entries(groups).map(([dateStr, items]) => {
            const d = new Date(dateStr);
            const presents = items.filter(i => i.status === 'PRESENT').length;
            return {
              date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              day: d.toLocaleDateString('en-US', { weekday: 'long' }),
              dayNum: d.getDate(),
              total: `${presents}/${items.length}`,
              status: presents === items.length ? "Perfect" : `Missed ${items.length - presents} Class`,
              classes: items.map(i => ({
                name: i.attendance_sessions?.subjects?.name || "Subject Lecture",
                time: i.attendance_sessions?.start_time || "09:00 AM - 10:30 AM",
                status: i.status === 'PRESENT' ? 'Present' : 'Absent',
                code: i.attendance_sessions?.subjects?.code || "CS801"
              }))
            };
          });

          setLogs(formatted);
        } else {
          setLogs([]);
        }
      } catch (err) {
        console.error("Error loading parent attendance history:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAttendanceHistory();
  }, []);

  const filteredLogs = useMemo(() => {
    if (selectedDayNum === null) return logs;
    return logs.filter(l => l.dayNum === selectedDayNum);
  }, [selectedDayNum, logs]);

  const weekDays = useMemo(() => {
    const days = [];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const dNum = cur.getDate();
      const logForDay = logs.find(l => l.dayNum === dNum);
      let status = "all-present";
      if (i === 6) status = "holiday";
      else if (logForDay && logForDay.status.includes("Missed")) status = "has-absent";

      days.push({
        dayNum: dNum,
        dayName: dayNames[i],
        status
      });
    }
    return days;
  }, [logs]);

  const handleDownloadPDF = () => {
    toast.loading("Generating Guardian Attendance Statement...");
    setTimeout(() => {
      const doc = new jsPDF() as any;
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("ATTENDEX INSTITUTE OF TECHNOLOGY", 105, 20, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("GUARDIAN OFFICIAL ATTENDANCE VERIFICATION STATEMENT", 105, 28, { align: "center" });
      doc.text("STUDENT: RAHUL DESHMUKH (21CS042) • SECTION 4A", 105, 34, { align: "center" });

      const tableRows: any[] = [];
      filteredLogs.forEach(log => {
        log.classes.forEach(c => {
          tableRows.push([log.date, c.time, c.name, c.code, c.status.toUpperCase()]);
        });
      });

      autoTable(doc, {
        startY: 42,
        head: [['Date', 'Session Timing', 'Subject Title', 'Course Code', 'Telemetry Status']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
      });

      doc.save("Guardian_Attendance_Statement_21CS042.pdf");
      toast.dismiss();
      toast.success("Attendance Statement (PDF) Downloaded!");
    }, 800);
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full bg-slate-50">
        <Header title="Ward Attendance History" showBack />

        <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          {/* Header Overview Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 91.4% Overall Standing
                </span>
                <span className="text-xs font-semibold text-slate-400">Ward: Rahul Deshmukh (21CS042)</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daily Lecture Telemetry Log</h1>
              <p className="text-xs text-slate-500 font-medium">
                Day-by-day breakdown of all attended lectures, laboratory sessions, and absence alerts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <LeaveRequestModal 
                studentName="Rahul Deshmukh" 
                studentRoll="21CS042"
                triggerButton={
                  <Button variant="outline" className="h-9 px-3 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <FileCheck2 className="w-3.5 h-3.5 mr-1.5" /> Apply for Leave
                  </Button>
                }
              />
              <Button
                size="sm"
                onClick={handleDownloadPDF}
                className="h-9 px-4 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </Button>
            </div>
          </div>

          {/* Interactive Date Selector Strip */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-900">Academic Week: Oct 19 &ndash; Oct 25, 2026</span>
              </div>
              {selectedDayNum !== null && (
                <button
                  onClick={() => setSelectedDayNum(null)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Show Full Week</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const isSelected = selectedDayNum === day.dayNum;
                return (
                  <button 
                    key={day.dayNum}
                    onClick={() => setSelectedDayNum(isSelected ? null : day.dayNum)}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all cursor-pointer group text-center",
                      isSelected 
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                        : "bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] font-semibold uppercase tracking-wider mb-1",
                      isSelected ? "text-slate-300" : "text-slate-400"
                    )}>
                      {day.dayName}
                    </span>
                    <span className={cn(
                      "text-base font-bold leading-none",
                      isSelected ? "text-white" : "text-slate-900"
                    )}>
                      {day.dayNum}
                    </span>
                    
                    {/* Status Dot */}
                    <div className="mt-2 flex items-center justify-center">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        day.status === "all-present" && (isSelected ? "bg-emerald-400" : "bg-emerald-500"),
                        day.status === "has-absent" && (isSelected ? "bg-rose-400" : "bg-rose-500"),
                        day.status === "holiday" && (isSelected ? "bg-slate-500" : "bg-slate-300")
                      )} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Logs Breakdown */}
          <div className="space-y-6">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                <span className="text-xs font-medium">Fetching lecture telemetry logs from database...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-slate-300 bg-white rounded-2xl space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Attendance Records Logged</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are no attendance session logs recorded in the database for this date range yet.
                </p>
              </Card>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.date} className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{log.day}</h3>
                      <span className="text-xs text-slate-500 font-medium">&bull; {log.date}</span>
                    </div>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-md text-[10px] font-bold border",
                      log.status === "Perfect"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {log.total} Sessions Attended
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {log.classes.map((cls, j) => (
                      <Card key={j} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:border-blue-200 transition-all flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border",
                            cls.status === 'Present' 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                              : "bg-rose-50 text-rose-600 border-rose-200"
                          )}>
                            {cls.status === 'Present' ? <CheckCircle2 className="w-4 h-4" /> : <XSquare className="w-4 h-4" />}
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-900 tracking-tight">{cls.name}</h4>
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {cls.time}
                            </div>
                          </div>
                        </div>

                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border shrink-0",
                          cls.status === 'Present' 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        )}>
                          {cls.status}
                        </span>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Advisor Callback Card */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-sm font-bold text-white">Have questions about missed sessions?</h4>
              <p className="text-xs text-slate-400 font-medium">Contact Designated Proctor Advisor Dr. Pavan Kulkarni.</p>
            </div>
            <Link href="/parent/proctor">
              <Button
                className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shrink-0"
              >
                <Phone className="w-3.5 h-3.5 mr-1.5" /> Request Advisor Callback
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
