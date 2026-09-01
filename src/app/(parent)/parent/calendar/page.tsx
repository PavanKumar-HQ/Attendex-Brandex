"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CalendarDays, 
  Download, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Flag,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ACADEMIC_EVENTS = [
  {
    month: "October 2026",
    events: [
      { date: "Oct 05 - Oct 08", title: "Continuous Internal Assessment (CIA-2) Week", type: "Examination", status: "Upcoming", badge: "Critical" },
      { date: "Oct 12, 2026", title: "Parent-Teacher Advisory & Proctor Consultation", type: "Advisory", status: "Scheduled", badge: "PTM" },
      { date: "Oct 18 - Oct 30", title: "End-Semester Theory & Practical Examinations", type: "Final Exam", status: "Upcoming", badge: "Official" },
    ]
  },
  {
    month: "November 2026",
    events: [
      { date: "Nov 02 - Nov 15", title: "Semester Break & Inter-Collegiate Tech Symposium", type: "Break / Events", status: "Upcoming", badge: "Vacation" },
      { date: "Nov 20, 2026", title: "Final Semester Grade Ledger Publication", type: "Results", status: "Upcoming", badge: "Grades" },
    ]
  },
  {
    month: "December 2026",
    events: [
      { date: "Dec 01, 2026", title: "Spring Semester 2027 Registration & Fee Clearance", type: "Enrollment", status: "Upcoming", badge: "Academic" },
      { date: "Dec 07, 2026", title: "Commencement of Spring 2027 Instruction Classes", type: "Instruction", status: "Upcoming", badge: "Classes" },
    ]
  }
];

export default function ParentCalendarPage() {
  const handleDownloadPDF = () => {
    toast.loading("Compiling Official University Academic Calendar...");
    setTimeout(() => {
      const doc = new jsPDF() as any;
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("ATTENDEX INSTITUTE OF TECHNOLOGY", 105, 20, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("OFFICIAL ACADEMIC CALENDAR & MILESTONES (2026 - 2027)", 105, 28, { align: "center" });

      const rows: any[] = [];
      ACADEMIC_EVENTS.forEach(m => {
        m.events.forEach(e => {
          rows.push([m.month, e.date, e.title, e.type, e.status]);
        });
      });

      autoTable(doc, {
        startY: 40,
        head: [['Month', 'Dates', 'Event / Milestone', 'Category', 'Status']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 5 },
      });

      doc.save("University_Academic_Calendar_2026.pdf");
      toast.dismiss();
      toast.success("Academic Calendar Downloaded!");
    }, 800);
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full bg-slate-50">
        <Header title="Institutional Academic Calendar" showBack />

        <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          {/* Header Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" /> Academic Year 2026 - 2027
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">University Calendar &amp; Milestone Roadmap</h1>
              <p className="text-xs text-slate-500 font-medium">
                Keep track of CIA examination weeks, parent-teacher consultation dates, and term holidays.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => toast.success("Synced with Device Calendar", { description: "iCal calendar feed updated." })}
                variant="outline"
                className="h-9 px-3 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Sync iCal</span>
              </Button>
              <Button
                onClick={handleDownloadPDF}
                className="h-9 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Calendar (PDF)</span>
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-6">
            {ACADEMIC_EVENTS.map((m, mIdx) => (
              <div key={mIdx} className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Flag className="w-3.5 h-3.5 text-blue-600" />
                  {m.month}
                </h3>

                <div className="space-y-3">
                  {m.events.map((ev, eIdx) => (
                    <Card key={eIdx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center shrink-0 min-w-[100px]">
                          <span className="text-xs font-bold text-slate-900">{ev.date}</span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{ev.title}</h4>
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                              {ev.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">{ev.type}</p>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-slate-500 self-end sm:self-center">
                        {ev.status}
                      </span>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
