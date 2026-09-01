"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Mail, Phone, MapPin, Calendar, CheckCircle2, AlertCircle, TrendingUp, TrendingDown,
  UserRound, History, Activity, MessageSquare
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { toast } from "sonner";

import { academicService } from "@/services/academic";

interface StudentProfileProps {
  student: any;
  onClose: () => void;
}

export function StudentProfile({ student, onClose }: StudentProfileProps) {
  const [mounted, setMounted] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.id) return;
    const loadSummary = async () => {
        try {
            const data = await academicService.getStudentSummary(student.id);
            setSummary(data);
        } catch (err) {
            console.error("Failed to load student summary:", err);
        } finally {
            setLoading(false);
        }
    };
    loadSummary();
  }, [student?.id]);

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF() as any;
      const timestamp = format(new Date(), 'dd-MMM-yyyy HH:mm');

      // 1. Institutional Branding
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); 
      doc.text("STUDENT PERFORMANCE AUDIT", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text(`Official Academic Record | Processed: ${timestamp}`, 105, 28, { align: "center" });

      // 2. Identity Block
      doc.setDrawColor(241, 245, 249);
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 35, 182, 40, 'F');
      
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text(`Identity: ${student.name}`, 20, 48);
      doc.text(`Reg No: ${student.roll || student.roll_number || 'N/A'}`, 20, 56);
      doc.text(`Current Attendance: ${attendanceValue}%`, 120, 48);
      doc.text(`Risk Status: ${isAtRisk ? 'HIGH' : 'LOW'}`, 120, 56);

      // 3. Subject-wise Analysis
      const subjectData = summary?.subjectWise?.map((sw: any) => [
          sw.name,
          `${sw.present}/${sw.total}`,
          `${sw.pct}%`,
          sw.pct < 75 ? "AT RISK" : "NORMAL"
      ]) || [];

      doc.setFontSize(12);
      doc.text("Subject-wise Attendance Ledger", 14, 85);

      autoTable(doc, {
          startY: 90,
          head: [["Course Blueprint", "Ratio (P/T)", "Percentage", "Status"]],
          body: subjectData,
          theme: "grid",
          headStyles: { fillColor: [15, 23, 42] }
      });

      // 4. Verification Footer
      const finY = (doc as any).lastAutoTable.finalY + 30;
      doc.save(`Performance_Audit_${student.name.replace(/\s/g, '_')}.pdf`);
      toast.success("Individual Audit PDF Generated");
    } catch (err) {
      console.error(err);
      toast.error("Audit compilation failed");
    }
  };

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!student) return null;

  const attendanceValue = summary ? summary.attendancePct : parseInt(student.attendance || "0");
  const isAtRisk = attendanceValue < 75;

  const content = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 font-sans">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-[95vw] md:w-full max-w-4xl max-h-[92vh] md:max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden border border-slate-200"
        >
          <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all z-20"
          >
              <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* Left Sidebar / Top Header on Mobile */}
          <div className="w-full md:w-[320px] bg-slate-50 p-6 md:p-8 flex flex-col items-center justify-center space-y-4 md:space-y-6 border-b md:border-b-0 md:border-r border-slate-200 shrink-0">
             <div className="relative">
                 <div className="w-20 h-20 md:w-32 md:h-32 rounded-2xl bg-white flex items-center justify-center overflow-hidden ring-4 ring-white shadow-md border border-slate-200">
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <UserRound className="w-10 h-10 md:w-16 md:h-16 text-slate-400" />
                    </div>
                 </div>
                <div className={cn(
                  "absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-7 h-7 md:w-8 md:h-8 rounded-lg border-2 border-white flex items-center justify-center shadow-md",
                  isAtRisk ? 'bg-red-500' : 'bg-emerald-500'
                )}>
                  {isAtRisk ? <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" /> : <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />}
                </div>
             </div>

             <div className="text-center space-y-1">
                 <h2 className="text-base md:text-xl font-bold text-slate-900 leading-tight">{student.name}</h2>
                <span className="inline-block px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">{student.roll || student.roll_number || student.rollNumber}</span>
             </div>

             <div className="w-full grid grid-cols-2 md:grid-cols-1 gap-2">
                <div className="flex justify-between items-center px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                   <span className="text-xs font-semibold text-slate-500">Attendance</span>
                   <span className={cn("text-xs md:text-sm font-bold", isAtRisk ? 'text-red-600' : 'text-slate-900')}>
                     {loading ? "..." : `${attendanceValue}%`}
                   </span>
                </div>
                <div className="flex justify-between items-center px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                   <span className="text-xs font-semibold text-slate-500">Risk Score</span>
                   <span className={cn("text-xs font-bold uppercase", isAtRisk ? 'text-red-600' : 'text-emerald-600')}>{isAtRisk ? "High Risk" : "Normal"}</span>
                </div>
             </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 custom-scrollbar bg-white">
            {/* Subject-wise Grid */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Academic Course Coverage</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {loading ? (
                        Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
                        ))
                    ) : (
                        summary?.subjectWise?.map((sw: any) => (
                            <div key={sw.name} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800">{sw.name}</p>
                                    <p className="text-[11px] text-slate-500 font-medium">{sw.present} / {sw.total} Sessions</p>
                                </div>
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm",
                                    sw.pct < 75 ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                )}>
                                    {sw.pct}%
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm">
                <Mail className="w-4 h-4 mr-2" /> Email Notice
              </Button>
              <Button className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm">
                <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp SMS
              </Button>
            </div>

            <div className="pt-2">
               <Button 
                onClick={handleExportPDF}
                variant="outline" 
                className="w-full h-10 rounded-xl border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-all shadow-sm"
              >
                  Generate Official Transcript (PDF)
               </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
