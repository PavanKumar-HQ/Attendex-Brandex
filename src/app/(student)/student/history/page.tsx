"use client";

import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Filter,
  Download,
  CalendarDays,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface HistoryRecord {
  id: number;
  dateStr: string;
  dayNum: number;
  dayName: string;
  subject: string;
  code: string;
  status: "Present" | "Absent" | "On-Duty";
  slot: string;
  room: string;
  faculty: string;
}

const ATTENDANCE_HISTORY: HistoryRecord[] = [
  { id: 1, dateStr: "Oct 24, 2026", dayNum: 24, dayName: "Sat", subject: "Industry Mentorship & Seminar", code: "CS804", status: "Present", slot: "10:00 AM - 12:00 PM", room: "Hall 201", faculty: "Guest Lecturers" },
  { id: 2, dateStr: "Oct 23, 2026", dayNum: 23, dayName: "Fri", subject: "Applied Cryptography & Web3", code: "CS803", status: "Present", slot: "09:00 AM - 10:30 AM", room: "Hall 401", faculty: "Prof. A. Iyer" },
  { id: 3, dateStr: "Oct 23, 2026", dayNum: 23, dayName: "Fri", subject: "Department Colloquium", code: "CS805", status: "Present", slot: "02:00 PM - 03:30 PM", room: "Auditorium", faculty: "Dean of Academics" },
  { id: 4, dateStr: "Oct 22, 2026", dayNum: 22, dayName: "Thu", subject: "Algorithms & Complexity", code: "CS802", status: "Absent", slot: "10:00 AM - 11:30 AM", room: "Hall 302", faculty: "Dr. P. Patel" },
  { id: 5, dateStr: "Oct 22, 2026", dayNum: 22, dayName: "Thu", subject: "Engineering Capstone Practicum", code: "PR801", status: "Present", slot: "02:00 PM - 04:00 PM", room: "Innovation Hub", faculty: "Faculty Panel" },
  { id: 6, dateStr: "Oct 21, 2026", dayNum: 21, dayName: "Wed", subject: "Distributed Systems & Cloud", code: "CS801", status: "Present", slot: "09:00 AM - 10:30 AM", room: "Hall 401", faculty: "Prof. R. Sharma" },
  { id: 7, dateStr: "Oct 21, 2026", dayNum: 21, dayName: "Wed", subject: "VLSI Design & Hardware Lab", code: "EC801", status: "Present", slot: "11:00 AM - 12:30 PM", room: "Lab 1", faculty: "Dr. S. Kulkarni" },
  { id: 8, dateStr: "Oct 20, 2026", dayNum: 20, dayName: "Tue", subject: "Deep Learning & Neural Nets Lab", code: "AI602", status: "Present", slot: "11:00 AM - 01:00 PM", room: "AI Lab Block B", faculty: "Dr. K. Nair" },
  { id: 9, dateStr: "Oct 19, 2026", dayNum: 19, dayName: "Mon", subject: "Database Architecture & SQL", code: "IT401", status: "Present", slot: "11:00 AM - 12:30 PM", room: "Lab 2", faculty: "Dr. P. Patel" },
  { id: 10, dateStr: "Oct 19, 2026", dayNum: 19, dayName: "Mon", subject: "Computer Networks & Security", code: "CS802", status: "Present", slot: "02:00 PM - 03:30 PM", room: "Hall 302", faculty: "Prof. A. Iyer" },
];

const WEEK_DAYS = [
  { dayNum: 19, dayName: "Mon", status: "all-present" },
  { dayNum: 20, dayName: "Tue", status: "all-present" },
  { dayNum: 21, dayName: "Wed", status: "all-present" },
  { dayNum: 22, dayName: "Thu", status: "has-absent" },
  { dayNum: 23, dayName: "Fri", status: "all-present" },
  { dayNum: 24, dayName: "Sat", status: "all-present" },
  { dayNum: 25, dayName: "Sun", status: "holiday" },
];

export default function StudentHistoryPage() {
  const [selectedSubject, setSelectedSubject] = useState<string>("All Subjects");
  const [selectedDayNum, setSelectedDayNum] = useState<number | null>(null);

  const subjects = useMemo(() => {
    return ["All Subjects", ...Array.from(new Set(ATTENDANCE_HISTORY.map(h => h.subject)))];
  }, []);

  const filteredHistory = useMemo(() => {
    return ATTENDANCE_HISTORY.filter(h => {
      const matchSubject = selectedSubject === "All Subjects" || h.subject === selectedSubject;
      const matchDay = selectedDayNum === null || h.dayNum === selectedDayNum;
      return matchSubject && matchDay;
    });
  }, [selectedSubject, selectedDayNum]);

  const handleDownloadPDF = () => {
    toast.loading("Generating Official Attendance Statement...");
    setTimeout(() => {
      const doc = new jsPDF() as any;
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("ATTENDEX INSTITUTE OF TECHNOLOGY", 105, 20, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("STUDENT INDIVIDUAL ATTENDANCE AUDIT LOG", 105, 28, { align: "center" });
      doc.text("CANDIDATE: RAHUL DESHMUKH (21CS042) • SEMESTER 8", 105, 34, { align: "center" });

      const tableRows = filteredHistory.map(h => [
        h.dateStr,
        h.slot,
        h.subject,
        h.room,
        h.faculty,
        h.status.toUpperCase()
      ]);

      autoTable(doc, {
        startY: 42,
        head: [['Date', 'Session Slot', 'Course Name', 'Hall', 'Faculty Instructor', 'Status']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 4 },
      });

      doc.save("Attendance_Audit_Statement_21CS042.pdf");
      toast.dismiss();
      toast.success("Attendance Statement (PDF) Downloaded!");
    }, 800);
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full bg-slate-50">
        <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          
          {/* Header Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                  Biometric &amp; Lecture Telemetry
                </span>
                <span className="text-xs font-semibold text-slate-400">October 2026</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Audit Ledger</h1>
              <p className="text-xs text-slate-500 font-medium">
                Detailed timestamped record of every lecture session cross-verified with classroom attendance.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 h-9 px-3.5 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedSubject}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 rounded-xl p-1 border-slate-200 shadow-lg">
                  {subjects.map(subject => (
                    <DropdownMenuItem 
                      key={subject} 
                      onClick={() => setSelectedSubject(subject)}
                      className={cn(
                        "rounded-lg font-semibold text-xs py-2 transition-colors cursor-pointer",
                        selectedSubject === subject ? "bg-slate-900 text-white font-bold" : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      {subject}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                size="sm"
                onClick={handleDownloadPDF}
                className="h-9 px-4 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Statement</span>
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
                  <span>Show All Days</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {WEEK_DAYS.map((day) => {
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

          {/* Attendance Log Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Session Breakdown ({filteredHistory.length} Sessions)
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                {selectedDayNum ? `Showing records for Oct ${selectedDayNum}` : "Showing all records this month"}
              </span>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredHistory.map((item, i) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Card className="p-4 md:p-5 border border-slate-200 bg-white rounded-2xl shadow-sm hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                          item.status === 'Present' 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                            : "bg-rose-50 text-rose-600 border-rose-200"
                        )}>
                          {item.status === 'Present' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 tracking-tight">{item.subject}</h4>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              {item.code}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {item.slot}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {item.room}
                            </span>
                            <span className="text-slate-400 font-normal">
                              &bull; {item.faculty}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 pt-2 sm:pt-0 border-t sm:border-none border-slate-100">
                        <span className="text-xs font-semibold text-slate-600">{item.dateStr}</span>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide border",
                          item.status === 'Present' 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        )}>
                          {item.status}
                        </span>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredHistory.length === 0 && (
                <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                  <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">No attendance sessions found for this filter.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setSelectedSubject("All Subjects"); setSelectedDayNum(null); }}
                    className="h-8 px-3 text-xs font-semibold rounded-lg border-slate-200"
                  >
                    Reset Filter
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
