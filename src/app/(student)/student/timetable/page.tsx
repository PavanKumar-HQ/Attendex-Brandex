"use client";

import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import {
    Clock, User, MapPin, Calendar,
    UploadCloud, RefreshCcw, Sparkles, FileSpreadsheet,
    BookOpen, Download, AlertCircle, CheckCircle2, ChevronRight
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { academicService } from "@/services/academic";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Timetable-specific types ────────────────────────────────────────
interface TimetableSlot {
    id: string;
    day_of_week: string;
    subject: string;
    teacher_name: string;
    room_number: string;
    start_time: string;
    end_time: string;
    color_code?: string;
    class_id: string;
    classes?: { name: string; section: string };
}

interface Exam {
    id: string;
    subject: string;
    exam_date: string;
    room_number?: string;
}

interface Notification {
    id: string;
    title: string;
    created_at: string;
}

interface TimetableProps {
    isParentView?: boolean;
    isTeacherView?: boolean;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
type Day = typeof DAYS[number];

const DEFAULT_TIMETABLE: Record<string, TimetableSlot[]> = {
  Monday: [
    { id: "tt-1", day_of_week: "Monday", subject: "Distributed Systems & Cloud", teacher_name: "Prof. R. Sharma", room_number: "Hall 401", start_time: "09:00", end_time: "10:30", color_code: "blue", class_id: "cls-1" },
    { id: "tt-2", day_of_week: "Monday", subject: "Database Architecture & SQL Lab", teacher_name: "Dr. P. Patel", room_number: "Lab 2", start_time: "11:00", end_time: "12:30", color_code: "indigo", class_id: "cls-1" },
    { id: "tt-3", day_of_week: "Monday", subject: "Computer Networks & Security", teacher_name: "Prof. A. Iyer", room_number: "Hall 302", start_time: "14:00", end_time: "15:30", color_code: "emerald", class_id: "cls-1" }
  ],
  Tuesday: [
    { id: "tt-4", day_of_week: "Tuesday", subject: "Artificial Intelligence & Robotics", teacher_name: "Dr. K. Nair", room_number: "Hall 201", start_time: "09:00", end_time: "10:30", color_code: "amber", class_id: "cls-1" },
    { id: "tt-5", day_of_week: "Tuesday", subject: "Deep Learning & Neural Nets Lab", teacher_name: "Dr. K. Nair", room_number: "AI Lab Block B", start_time: "11:00", end_time: "13:00", color_code: "rose", class_id: "cls-1" }
  ],
  Wednesday: [
    { id: "tt-6", day_of_week: "Wednesday", subject: "Operating Systems & Kernel Dev", teacher_name: "Prof. R. Sharma", room_number: "Hall 401", start_time: "09:00", end_time: "10:30", color_code: "blue", class_id: "cls-1" },
    { id: "tt-7", day_of_week: "Wednesday", subject: "VLSI Design & Architecture", teacher_name: "Dr. S. Kulkarni", room_number: "Lab 1", start_time: "11:00", end_time: "12:30", color_code: "indigo", class_id: "cls-1" }
  ],
  Thursday: [
    { id: "tt-8", day_of_week: "Thursday", subject: "Algorithms & Computational Complexity", teacher_name: "Dr. P. Patel", room_number: "Hall 302", start_time: "10:00", end_time: "11:30", color_code: "emerald", class_id: "cls-1" },
    { id: "tt-9", day_of_week: "Thursday", subject: "Engineering Capstone Practicum", teacher_name: "Faculty Panel", room_number: "Innovation Hub", start_time: "14:00", end_time: "16:00", color_code: "amber", class_id: "cls-1" }
  ],
  Friday: [
    { id: "tt-10", day_of_week: "Friday", subject: "Applied Cryptography & Web3", teacher_name: "Prof. A. Iyer", room_number: "Hall 401", start_time: "09:00", end_time: "10:30", color_code: "rose", class_id: "cls-1" },
    { id: "tt-11", day_of_week: "Friday", subject: "Department Colloquium Seminar", teacher_name: "Dean of Academics", room_number: "Auditorium", start_time: "14:00", end_time: "15:30", color_code: "blue", class_id: "cls-1" }
  ],
  Saturday: [
    { id: "tt-12", day_of_week: "Saturday", subject: "Industry Mentorship & Guest Lecture", teacher_name: "Industry Experts", room_number: "Hall 201", start_time: "10:00", end_time: "12:00", color_code: "emerald", class_id: "cls-1" }
  ]
};

// ───────────────────────────────────────────────────────────────────
export default function StudentTimetable({ isParentView = false, isTeacherView = false }: TimetableProps) {
    const [selectedDay, setSelectedDay] = useState<Day>("Monday");
    const [schedule, setSchedule] = useState<TimetableSlot[]>(DEFAULT_TIMETABLE.Monday);
    const [loading, setLoading] = useState(false);
    const [exams, setExams] = useState<Exam[]>([
      { id: "ex-1", subject: "Distributed Systems & Cloud Computing", exam_date: "Oct 18, 2026", room_number: "Hall 401" }
    ]);
    const [alerts, setAlerts] = useState<Notification[]>([
      { id: "not-1", title: "Continuous Assessment CIA-2 dates published", created_at: new Date().toISOString() },
      { id: "not-2", title: "AI Lab shifted to Computing Hub Block B", created_at: new Date(Date.now() - 3600000 * 4).toISOString() }
    ]);

    // ── Sidebar data ──────────────────────────────────────────────
    useEffect(() => {
        const fetchSidebar = async () => {
            try {
                const [examRes, noteRes] = await Promise.all([
                    supabase.from('exams').select('*').limit(1).order('exam_date', { ascending: true }),
                    supabase.from('notifications').select('*').limit(3).order('created_at', { ascending: false })
                ]);
                if (examRes?.data && examRes.data.length > 0) setExams(examRes.data as Exam[]);
                if (noteRes?.data && noteRes.data.length > 0) setAlerts(noteRes.data as Notification[]);
            } catch {
                // Keep default state
            }
        };
        fetchSidebar();
    }, []);

    // ── Schedule: re-fetch on day change ─────────────────────────
    const loadSchedule = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setSchedule(DEFAULT_TIMETABLE[selectedDay] || DEFAULT_TIMETABLE.Monday);
                return;
            }

            let classId: string | null = null;
            if (isParentView) {
                const student = await academicService.getStudentByParentEmail(user.email!);
                classId = student?.class_id ?? null;
            } else {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('class_id')
                    .eq('id', user.id)
                    .single();
                classId = profile?.class_id ?? null;
            }

            let query = supabase
                .from('timetables')
                .select('*, classes(name, section)')
                .eq('day_of_week', selectedDay)
                .order('start_time', { ascending: true });

            if (classId) query = query.eq('class_id', classId);

            const { data, error } = await query;
            if (error || !data || data.length === 0) {
              setSchedule(DEFAULT_TIMETABLE[selectedDay] || DEFAULT_TIMETABLE.Monday);
            } else {
              setSchedule(data as TimetableSlot[]);
            }
        } catch {
            setSchedule(DEFAULT_TIMETABLE[selectedDay] || DEFAULT_TIMETABLE.Monday);
        } finally {
            setLoading(false);
        }
    }, [selectedDay, isParentView, isTeacherView]);

    useEffect(() => { loadSchedule(); }, [loadSchedule]);

    // ── CSV Import ───────────────────────────────────────────────
    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        toast.loading("Ingesting academic schedule...");
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split('\n').filter(l => l.trim() !== "");
                if (lines.length < 2) throw new Error("File is empty");
                const rows = lines.slice(1).map(line => {
                    const c = line.split(',').map(v => v.trim());
                    return { className: c[0], section: c[1], day_of_week: c[2], subject: c[3], teacher_name: c[4], room_number: c[5], start_time: c[6], end_time: c[7] };
                });
                const { data: clsData } = await supabase.from('classes').select('id, name, section');
                const payload = rows.map(row => {
                    const matched = clsData?.find(
                        c => c.name.toLowerCase() === row.className.toLowerCase()
                          && c.section.toLowerCase() === row.section.toLowerCase()
                    );
                    if (!matched) return null;
                    return { ...row, class_id: matched.id };
                }).filter(Boolean);
                if (!payload.length) throw new Error("No rows matched. Check class names & sections.");
                const { error } = await supabase.from('timetables').insert(payload);
                if (error) throw error;
                toast.dismiss();
                toast.success(`Synchronized ${payload.length} sessions`);
                loadSchedule();
            } catch (err: any) {
                toast.dismiss();
                toast.error("Import failed", { description: err.message });
            }
        };
        reader.readAsText(file);
    };

    const handleDownloadTimetablePDF = () => {
        const doc = new jsPDF() as any;
        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42);
        doc.text("ATTENDEX INSTITUTE OF TECHNOLOGY", 105, 20, { align: "center" });
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`SEMESTER TIMETABLE — ${selectedDay.toUpperCase()}`, 105, 28, { align: "center" });

        const rows = schedule.map(s => [
            `${s.start_time} - ${s.end_time}`,
            s.subject,
            s.teacher_name,
            s.room_number,
            "4 Credits"
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['Time Slot', 'Course Title', 'Instructor', 'Venue', 'Credits']],
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 5 },
        });

        doc.save(`Timetable_${selectedDay}.pdf`);
        toast.success(`Exported ${selectedDay} Schedule (PDF)`);
    };

    const accentColor = (code?: string) => {
        if (code === 'blue') return "bg-blue-600";
        if (code === 'indigo') return "bg-indigo-600";
        if (code === 'rose') return "bg-rose-600";
        if (code === 'emerald') return "bg-emerald-600";
        if (code === 'amber') return "bg-amber-600";
        return "bg-slate-400";
    };

    return (
        <PageTransition>
            <div className="flex flex-col min-h-screen w-full overflow-x-hidden bg-slate-50">
                <Header title={isParentView ? "Class Timetable" : (isTeacherView ? "Manage Schedule" : "Class Timetable")} showBack />

                {/* Centered page content */}
                <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">

                    {/* Day Selector Segmented Bar */}
                    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
                            {DAYS.map((day) => (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={cn(
                                        "h-9 px-4 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                                        selectedDay === day
                                            ? "bg-slate-900 text-white shadow-sm font-bold"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                                    )}
                                >
                                    <span className="md:hidden">{day.slice(0, 3)}</span>
                                    <span className="hidden md:inline">{day}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownloadTimetablePDF}
                                className="h-9 px-3 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Export PDF</span>
                            </Button>

                            {isTeacherView && (
                                <label className="h-9 px-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer shadow-sm">
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    <span>Upload CSV</span>
                                    <input type="file" className="hidden" accept=".csv" onChange={handleImportCSV} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* Schedule feed (8 cols) */}
                        <div className="lg:col-span-8 space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {selectedDay}'s Academic Schedule
                                </h3>
                                <span className="text-xs font-semibold text-slate-400">
                                    {schedule.length} Sessions Planned
                                </span>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedDay}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.15 }}
                                    className="space-y-3"
                                >
                                    {schedule.map((slot) => (
                                        <Card key={slot.id} className="relative overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-blue-200 transition-all">
                                            <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", accentColor(slot.color_code))} />
                                            <div className="p-4 md:p-5 pl-5 md:pl-6 space-y-3">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="shrink-0 flex flex-col items-center justify-center min-w-[70px] bg-slate-50 border border-slate-100 rounded-xl py-2 px-2">
                                                            <Clock className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                                                            <span className="text-xs font-bold text-slate-900">{slot.start_time?.slice(0, 5)}</span>
                                                            <span className="text-[10px] font-medium text-slate-400">to {slot.end_time?.slice(0, 5)}</span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-sm font-bold text-slate-900 tracking-tight">{slot.subject}</h4>
                                                                <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-600 rounded-md">
                                                                    Sec {slot.classes?.section || '4A'}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                                                                <span className="flex items-center gap-1.5">
                                                                    <User className="w-3.5 h-3.5 text-blue-600" />
                                                                    {slot.teacher_name}
                                                                </span>
                                                                <span className="flex items-center gap-1.5">
                                                                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                                                    {slot.room_number}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => toast.info("Course Material", { description: `Opening syllabus units and lecture slides for ${slot.subject}.` })}
                                                            className="h-8 px-3 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                                                        >
                                                            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                                            <span>Materials</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}

                                    {schedule.length === 0 && (
                                        <div className="py-16 flex flex-col items-center justify-center text-center gap-2 bg-white rounded-2xl border border-slate-200">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-1">
                                                <Calendar className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <p className="text-slate-600 font-semibold text-xs">
                                                No lectures scheduled for {selectedDay}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Right Sidebar (4 cols) */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Final Exam Card */}
                            <Card className="border-none rounded-2xl bg-slate-900 text-white shadow-xl overflow-hidden p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold tracking-tight">Upcoming Semester Exam</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-400/30">
                                        Oct 2026
                                    </span>
                                </div>
                                <div className="p-4 rounded-xl bg-white/10 border border-white/10 space-y-2">
                                    <p className="text-xs font-bold text-blue-300">{exams[0]?.subject || "Distributed Systems & Cloud"}</p>
                                    <div className="flex items-center justify-between text-xs text-slate-300">
                                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-blue-400" /> {exams[0]?.exam_date || "Oct 18, 2026"}</span>
                                        <span className="font-bold text-white">{exams[0]?.room_number || "Hall 401"}</span>
                                    </div>
                                </div>
                                <Button 
                                    onClick={() => toast.success("Hall ticket is active in your student dashboard.")}
                                    className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm"
                                >
                                    View Hall Ticket Token
                                </Button>
                            </Card>

                            {/* Department Announcements */}
                            <Card className="border border-slate-200 rounded-2xl bg-white shadow-sm p-6 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        Department Notices
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {alerts.map((alert) => (
                                        <div key={alert.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                                            <p className="text-xs font-bold text-slate-900 leading-snug">{alert.title}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{new Date(alert.created_at).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                    </div>
                </div>
            </div>
        </PageTransition>
    );
}
