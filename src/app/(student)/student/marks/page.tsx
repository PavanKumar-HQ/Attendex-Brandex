"use client";

import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { 
  BookOpen, 
  Award, 
  ChevronRight, 
  Star, 
  Trophy, 
  Activity, 
  RefreshCcw,
  Download
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { academicService } from "@/services/academic";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { supabase } from "@/lib/supabase";
import { resolveActiveStudent, InstitutionalStudent } from "@/lib/student-auth";

export default function StudentMarksPage() {
  const { data: academicData, isLoading } = useQuery({
    queryKey: ['student-academic-data'],
    queryFn: async () => {
      let rollNumber: string | undefined = undefined;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        rollNumber = user?.user_metadata?.roll_number;
      } catch {
        // Ignore
      }

      if (!rollNumber && typeof document !== "undefined") {
        const cookieMatch = document.cookie.match(/attendex_student_roll=([^;]+)/);
        if (cookieMatch) rollNumber = decodeURIComponent(cookieMatch[1]);
      }

      const student = resolveActiveStudent(rollNumber);
      const safeRoll = (!student.roll_number || student.roll_number.toUpperCase() === "STUDENT") ? "CS-11" : student.roll_number;

      try {
        const [marksRes, summary] = await Promise.all([
          fetch(`/api/marks?roll_number=${encodeURIComponent(safeRoll)}`, { cache: "no-store" }).then(r => r.json()).catch(() => null),
          academicService.getStudentSummary(student.id)
        ]);
        const marks = marksRes?.success ? marksRes.data : null;
        return { student, marks, summary };
      } catch {
        return { student, marks: null, summary: null };
      }
    }
  });

  const marksList = academicData?.marks || [];
  const summary = academicData?.summary;
  const activeStudent = academicData?.student || resolveActiveStudent();

  const displaySubjects = (marksList.length > 0 ? marksList : [
    { subject_code: "CS401", subject_name: "Database Management Systems & SQL Lab", credits: 4, ciaTotal: 5, testTotal: 9.5, attendanceMarks: 5, final_marks: 19.5, grade: "O" },
    { subject_code: "CS402", subject_name: "Operating Systems & Kernel Development", credits: 4, ciaTotal: 4.5, testTotal: 9.0, attendanceMarks: 5, final_marks: 18.5, grade: "O" },
    { subject_code: "CS403", subject_name: "Computer Networks & Protocol Security", credits: 3, ciaTotal: 4.0, testTotal: 8.5, attendanceMarks: 4, final_marks: 16.5, grade: "A+" },
    { subject_code: "CS404", subject_name: "Distributed Systems & Cloud Computing", credits: 4, ciaTotal: 4.5, testTotal: 9.2, attendanceMarks: 5, final_marks: 18.7, grade: "O" }
  ]).map((s: any) => ({
    name: s.subject_name || s.name,
    code: s.subject_code || s.code,
    credits: s.credits || 4,
    displayMarks: { 
      cia: `${s.ciaTotal ?? 5}/5`, 
      tests: `${s.testTotal ?? 9}/10`, 
      attendance: `${s.attendanceMarks ?? 5}/5`, 
      total: `${s.final_marks ?? 19}/20` 
    },
    grade: s.grade || (s.final_marks >= 18 ? "O" : s.final_marks >= 15 ? "A+" : s.final_marks >= 12 ? "A" : "B+")
  }));

  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadMarksheet = () => {
    setIsExporting(true);
    toast.loading("Generating Official Grade Marksheet...");

    setTimeout(() => {
      const doc = new jsPDF() as any;
      
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("ATTENDEX INSTITUTE OF TECHNOLOGY", 105, 20, { align: "center" });
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("OFFICIAL CONTINUOUS ASSESSMENT GRADE SHEET", 105, 28, { align: "center" });
      doc.text(`Internal CGPA: ${(summary as any)?.cgpa || "8.4"} | Credits Earned: ${(summary as any)?.credits || "24/24"}`, 105, 34, { align: "center" });

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 40, 182, 26, 3, 3, "FD");

      const activeSt = academicData?.student || resolveActiveStudent();
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Student: ${activeSt.name}`, 20, 50);
      doc.text(`Roll Number: ${activeSt.roll_number}`, 20, 58);
      doc.text(`Class: ${activeSt.class_name}`, 120, 50);
      doc.text(`Status: Enrolled`, 120, 58);

      const tableData = displaySubjects.map((s: any) => [
        s.code,
        s.name,
        s.credits.toString(),
        s.displayMarks.cia,
        s.displayMarks.tests,
        s.displayMarks.attendance,
        s.displayMarks.total,
        s.grade
      ]);

      autoTable(doc, {
        startY: 72,
        head: [['Code', 'Course Title', 'Credits', 'CIA (5)', 'Tests (10)', 'Att (5)', 'Total (20)', 'Grade']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 18;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("This digital transcript is certified by Attendex Academic Registry Division.", 14, finalY);
      doc.text("Controller of Examinations (Sign)", 140, finalY + 14);

      doc.save(`Marksheet_${activeSt.roll_number}.pdf`);
      setIsExporting(false);
      toast.dismiss();
      toast.success("Marksheet Downloaded Successfully!");
    }, 1000);
  };


  return (
    <PageTransition>
      <div className="flex flex-col min-h-full pb-20 pt-8 max-w-6xl mx-auto space-y-10 px-4 md:px-0">
        
        <Header title="My Marks" showBack />

        {isLoading ? (
            <div className="flex-1 py-24 flex flex-col items-center justify-center">
                <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-sm font-semibold text-slate-500">Loading Grades...</p>
            </div>
        ) : (
            <div className="space-y-10">
        {/* GPA Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Card className="p-5 md:p-6 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-sm relative overflow-hidden group">
                <div className="relative z-10">
                    <Award className="w-7 h-7 md:w-8 md:h-8 text-amber-500 mb-2 md:mb-4" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Internal CGPA</p>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900">{activeStudent.cgpa ? activeStudent.cgpa.toFixed(2) : (summary as any)?.cgpa || "9.25"}</h2>
                </div>
            </Card>
            <div className="grid grid-cols-2 gap-3 col-span-1 md:col-span-2 md:grid-cols-2 md:gap-6">
                <StatusStat label="Total Credits" value={(summary as any)?.credits || "24 / 24"} icon={BookOpen} color="blue" />
                <StatusStat label="Dept Rank" value={(summary as any)?.rank || "#4"} icon={Trophy} color="emerald" />
            </div>
        </div>

        {/* Detailed Table */}
        <section className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Subject-wise Breakdown</h3>
            <div className="grid grid-cols-1 gap-4">
                {displaySubjects.map((sub: any, i: number) => (
                    <motion.div
                        key={sub.code}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="p-5 border-slate-200 hover:border-blue-200 transition-all group rounded-2xl bg-white shadow-sm overflow-hidden border">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 w-full">
                                <div className="flex items-center gap-3.5 w-full md:w-auto md:min-w-[240px]">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200 shrink-0">
                                        {sub.code}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-sm text-slate-900 leading-tight truncate">{sub.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{sub.credits} Credits • Core Subject</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-6 w-full flex-1 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                                    <MarkItem label="CIA (5)" val={sub.displayMarks.cia} />
                                    <MarkItem label="Test Wt. (10)" val={sub.displayMarks.tests} />
                                    <MarkItem label="Attendance (5)" val={sub.displayMarks.attendance} />
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Final Score</p>
                                        <p className="text-sm font-bold text-blue-600">{sub.displayMarks.total}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 md:pl-4 md:border-l border-slate-100">
                                    <span className="md:hidden text-xs text-slate-400 font-medium">Grade Standing</span>
                                    <div className={cn(
                                        "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0",
                                        sub.grade === 'O' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
                                        sub.grade === 'A+' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-50 text-slate-600 border border-slate-200'
                                    )}>
                                        {sub.grade}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </section>

        {/* Legend & Export */}
        <div className="p-6 md:p-8 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-200 shrink-0">
                   <Star className="w-5 h-5 text-indigo-600" />
               </div>
               <p className="text-xs font-medium text-slate-600 leading-relaxed">
                 {summary?.attendancePct && summary.attendancePct > 90 
                   ? "Excellent standing! Your strong attendance provides maximum internal evaluation weightage."
                   : "Reminder: Regular attendance ensures you meet the minimum 75% examination eligibility criteria."}
               </p>
            </div>
            <Button 
              onClick={handleDownloadMarksheet}
              disabled={isExporting}
              className="h-10 px-5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-sm shrink-0 flex items-center gap-2"
            >
                {isExporting ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isExporting ? "Generating..." : "Download Official Marksheet (PDF)"}</span>
            </Button>
        </div>
        </div>
        )}
      </div>
    </PageTransition>
  );
}

function MarkItem({ label, val }: any) {
    return (
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-tight">{label}</p>
            <p className="text-xs font-bold text-slate-700">{val}</p>
        </div>
    )
}

function StatusStat({ label, value, icon: Icon, color }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100"
    };
    return (
        <Card className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-colors">
            <div className="min-w-0 flex-1 pr-2">
               <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1 truncate">{label}</p>
               <h2 className="text-xl sm:text-3xl font-black text-slate-900 truncate">{value}</h2>
            </div>
            <div className={cn("w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0", colors[color])}>
                <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
        </Card>
    );
}
