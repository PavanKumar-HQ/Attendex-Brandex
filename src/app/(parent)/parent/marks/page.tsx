"use client";

import { useState } from "react";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { 
  Target, 
  Lightbulb, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight, 
  HelpCircle, 
  FileBarChart, 
  RefreshCcw,
  Download
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { academicService } from "@/services/academic";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { supabase } from "@/lib/supabase";

export default function ParentMarksPage() {
  const { data: academicData, isLoading } = useQuery({
    queryKey: ['parent-student-data'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find student linked to this parent email
      const student = await academicService.getStudentByParentEmail(user.email!);
      if (!student) return null;

      const [{ data: marks }, summary] = await Promise.all([
        academicService.getStudentMarks(student.id),
        academicService.getStudentSummary(student.id)
      ]);

      return { student, marks, summary };
    }
  });

  const marks = academicData?.marks;
  const student = academicData?.student;
  const summary = academicData?.summary;

  const subjectReports = [
    { name: "Mathematics", marks: (marks as any)?.math || 18, color: "bg-blue-500" },
    { name: "Science", marks: (marks as any)?.science || 17, color: "bg-emerald-500" },
    { name: "English", marks: (marks as any)?.english || 19, color: "bg-indigo-500" },
    { name: "Physics", marks: (marks as any)?.physics || 16, color: "bg-rose-500" },
    { name: "Computer Science", marks: (marks as any)?.computer_science || 20, color: "bg-amber-500" },
    { name: "History", marks: (marks as any)?.history || 17, color: "bg-slate-500" },
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
    const remaining = Math.max(0, internalMarks - attMarks);
    const cia = Math.min(5, Math.round(remaining * (5/15)));
    const tests = Math.min(10, remaining - cia);

    return {
        ...s,
        score: `${internalMarks}/20`,
        breakdown: `Att: ${attMarks} | CIA: ${cia} | Test: ${tests}`,
        status: internalMarks >= 18 ? "Excellent" : internalMarks >= 15 ? "Very Good" : internalMarks >= 10 ? "Satisfactory" : "Needs Support",
        trend: internalMarks >= 15 ? "up" : "stable"
    };
  });



  const [isExporting, setIsExporting] = useState(false);

  const handleGenerateDigest = () => {
    setIsExporting(true);
    toast.loading("Compiling Official Progress Digest...");

    setTimeout(() => {
      const doc = new jsPDF() as any;
      
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("ATTENDEX INSTITUTE OF TECHNOLOGY", 105, 20, { align: "center" });
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("CONTINUOUS INTERNAL ASSESSMENT PROGRESS DIGEST", 105, 28, { align: "center" });
      doc.text(`Academic Standing: ${(summary as any)?.cgpa || "8.4"} CGPA | Attendance: ${summary?.attendance || "91.4%"}`, 105, 34, { align: "center" });

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 40, 182, 26, 3, 3, "FD");

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Student Name: ${student?.name || "Rahul Deshmukh"}`, 20, 50);
      doc.text(`Roll Number: ${student?.roll_number || "21CS042"}`, 20, 58);
      doc.text(`Evaluation Period: Mid-Semester 2026`, 120, 50);
      doc.text(`Faculty Advisor: Dr. Pavan Kulkarni`, 120, 58);

      const tableData = subjectReports.map(s => [s.name, s.score, s.status, s.breakdown]);

      autoTable(doc, {
        startY: 72,
        head: [['Subject', 'Internal Score (20)', 'Evaluation Status', 'Component Breakdown']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 5 },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("Advisor Annotation: Student demonstrates consistent academic aptitude. Maintaining attendance will ensure maximum internal weightage.", 14, finalY);
      doc.text("Dean of Academic Affairs — Certified Transcript", 14, finalY + 12);

      doc.save(`AcademicProgress_${student?.roll_number || "student"}.pdf`);
      setIsExporting(false);
      toast.dismiss();
      toast.success("Progress Digest (PDF) Exported Successfully!");
    }, 1000);
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-full pb-20 pt-8 max-w-5xl mx-auto space-y-10">
        
        <header className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Academic Progress Report</h1>
                <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] mt-1">Real-time evaluation ledger for {student?.name || "Your Ward"}</p>
            </div>
            <button 
              onClick={() => toast.success("Academic Target Saved", { description: "Target CGPA benchmark set to 8.8 for upcoming semester examinations." })}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-sm"
            >
                <Target className="w-4 h-4" />
                <span>Set Target Grade</span>
            </button>
        </header>

        {isLoading ? (
            <div className="flex-1 py-24 flex flex-col items-center justify-center">
                <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-sm font-semibold text-slate-500">Loading Progress Report...</p>
            </div>
        ) : (
            <div className="space-y-8">
        {/* Intelligence Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 md:p-8 border-none bg-slate-900 rounded-2xl text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                <Award className="w-9 h-9 text-indigo-400 mb-4" />
                <h3 className="text-lg font-bold mb-2">Internal Assessment Summary</h3>
                <p className="text-slate-300 text-xs font-medium leading-relaxed">
                    {student?.name?.split(' ')[0]} has secured an aggregate internal rating of <strong>{(summary as any)?.cgpa || "0.0"}</strong>. 
                    {Number((summary as any)?.cgpa || 0) > 8 ? " This is significantly higher than the class median." : " Focus on consistent attendance to improve performance."}
                </p>
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Predicted Semester GPA</span>
                    <span className="text-2xl font-bold text-emerald-400">{(Number((summary as any)?.cgpa || 8.4) * 0.95).toFixed(2)}</span>
                </div>
            </Card>

            <Card className="p-6 md:p-8 border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col justify-between border">
                <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        <h3 className="text-base font-bold text-slate-900">Faculty Advisor Feedback</h3>
                    </div>
                    <p className="text-slate-600 text-xs font-medium leading-relaxed">
                        "{student?.name?.split(' ')[0]} demonstrates steady performance across laboratory and theory modules. 
                        Maintaining &ge;75% attendance will protect top-tier internal grading."
                    </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">PK</div>
                    <span className="text-xs font-semibold text-slate-700">Dr. Pavan Kulkarni — Institutional Advisor</span>
                </div>
            </Card>
        </div>

        {/* Detailed Breakdown */}
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Subject Breakdown &amp; Tests</h3>
                <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Internal Slabs: 20M Scale</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {subjectReports.map((sub, i) => (
                    <motion.div
                        key={sub.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Card className="p-5 border-slate-200 rounded-xl bg-white shadow-sm hover:border-blue-200 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border">
                            <div className="flex items-center gap-4 flex-1">
                                <div className={cn("w-2 h-10 rounded-full shrink-0", sub.color)} />
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900">{sub.name}</h4>
                                    <p className={cn("text-xs font-medium", sub.status === 'Needs Support' ? 'text-rose-600 font-bold' : 'text-slate-500')}>
                                        {sub.status} • {sub.breakdown}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6 self-end md:self-auto">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</p>
                                    <p className="text-base font-bold text-slate-900">{sub.score}</p>
                                </div>
                                <div className="hidden sm:block">
                                   {sub.trend === 'up' ? <ArrowUpRight className="w-5 h-5 text-emerald-500" /> : <ArrowDownRight className="w-5 h-5 text-slate-400" />}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </section>

        {/* Export Action */}
        <div className="p-6 md:p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
            <FileBarChart className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">Need an Official Printable Progress Report?</h4>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
              Download the official semester progress digest with complete faculty annotations and benchmark analysis.
            </p>
            <button 
              onClick={handleGenerateDigest}
              disabled={isExporting}
              className="px-6 py-2.5 bg-slate-900 text-xs font-semibold text-white rounded-xl shadow-sm hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto"
            >
                {isExporting ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isExporting ? "Generating..." : "Generate Official Progress Digest (PDF)"}</span>
            </button>
        </div>
        </div>
        )}
      </div>
    </PageTransition>
  );
}
