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

export default function StudentMarksPage() {
  const { data: academicData, isLoading } = useQuery({
    queryKey: ['student-academic-data'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const rollNumber = user.user_metadata.roll_number;
      const student = await academicService.getStudentByRoll(rollNumber);
      if (!student) return null;

      const [{ data: marks }, summary] = await Promise.all([
        academicService.getStudentMarks(student.id),
        academicService.getStudentSummary(student.id)
      ]);

      return { student, marks, summary };
    }
  });

  const marks = academicData?.marks;
  const summary = academicData?.summary;

  const displaySubjects = [
    { name: "Mathematics", code: "MAT", marks: (marks as any)?.math || 18 },
    { name: "Science", code: "SCI", marks: (marks as any)?.science || 17 },
    { name: "English", code: "ENG", marks: (marks as any)?.english || 19 },
    { name: "Physics", code: "PHY", marks: (marks as any)?.physics || 16 },
    { name: "Computer Science", code: "CS", marks: (marks as any)?.computer_science || 20 },
    { name: "History", code: "HIS", marks: (marks as any)?.history || 17 },
  ].map(s => {
    // Standardize to 20 for Internal Display
    const internalMarks = s.marks > 20 ? Math.round((s.marks / 100) * 20) : s.marks;
    
    // Calculate Attendance Marks based on slabs
    const attPct = summary?.attendancePct || 0;
    let attMarks = 2;
    if (attPct >= 90) attMarks = 5;
    else if (attPct >= 80) attMarks = 4;
    else if (attPct >= 75) attMarks = 3;

    // Remaining 15 marks split between CIA (5) and Tests (10)
    // We use a 1:2 ratio for the remaining score if we don't have granular data
    const remaining = Math.max(0, internalMarks - attMarks);
    const cia = Math.min(5, Math.round(remaining * (5/15)));
    const tests = Math.min(10, remaining - cia);

    return {
        ...s,
        credits: 4,
        displayMarks: { 
          cia: `${cia}/5`, 
          tests: `${tests}/10`, 
          attendance: `${attMarks}/5`, 
          total: `${internalMarks}/20` 
        },
        grade: internalMarks >= 18 ? "O" : internalMarks >= 15 ? "A+" : internalMarks >= 12 ? "A" : "B"
    };
  });

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

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Student: ${academicData?.student?.name || "Rahul Deshmukh"}`, 20, 50);
      doc.text(`Roll Number: ${academicData?.student?.roll_number || "21CS042"}`, 20, 58);
      doc.text(`Semester: 8th Semester B.Tech`, 120, 50);
      doc.text(`Department: Computer Science`, 120, 58);

      const tableData = displaySubjects.map(s => [
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

      doc.save(`Marksheet_${academicData?.student?.roll_number || "21CS042"}.pdf`);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 rounded-xl bg-slate-900 border-none text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
                <div className="relative z-10">
                    <Award className="w-8 h-8 text-yellow-400 mb-4" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Internal CGPA</p>
                    <h2 className="text-4xl font-bold">{(summary as any)?.cgpa || "0.0"}</h2>
                </div>
            </Card>
            <StatusStat label="Total Credits" value={(summary as any)?.credits || "0 / 24"} icon={BookOpen} color="blue" />
            <StatusStat label="Dept Rank" value={(summary as any)?.rank || "N/A"} icon={Trophy} color="emerald" />
        </div>

        {/* Detailed Table */}
        <section className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Subject-wise Breakdown</h3>
            <div className="grid grid-cols-1 gap-4">
                {displaySubjects.map((sub, i) => (
                    <motion.div
                        key={sub.code}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="p-5 border-slate-200 hover:border-blue-200 transition-all group rounded-2xl bg-white shadow-sm overflow-hidden border">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4 min-w-[240px]">
                                    <div className="w-11 h-11 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                                        {sub.code}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900 leading-tight">{sub.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{sub.credits} Credits • Core Subject</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
                                    <MarkItem label="CIA (5)" val={sub.displayMarks.cia} />
                                    <MarkItem label="Test Wt. (10)" val={sub.displayMarks.tests} />
                                    <MarkItem label="Attendance (5)" val={sub.displayMarks.attendance} />
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Final Score</p>
                                        <p className="text-sm font-bold text-blue-600">{sub.displayMarks.total}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pl-4 border-l border-slate-100 md:min-w-[80px] justify-end">
                                    <div className={cn(
                                        "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm",
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
        <Card className="p-6 rounded-xl bg-white border-slate-100 shadow-sm flex items-center justify-between border border-slate-100 group hover:border-slate-300 transition-colors">
            <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
               <h2 className="text-3xl font-bold text-slate-900">{value}</h2>
            </div>
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", colors[color])}>
                <Icon className="w-6 h-6" />
            </div>
        </Card>
    );
}
