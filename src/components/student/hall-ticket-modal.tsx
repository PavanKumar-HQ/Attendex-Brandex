"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Printer, CheckCircle2, ShieldCheck, Building2, Calendar, Award } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface HallTicketModalProps {
  studentName?: string;
  rollNumber?: string;
  branch?: string;
  semester?: string;
  triggerButton?: React.ReactElement;
}

export function HallTicketModal({
  studentName = "Rahul Deshmukh",
  rollNumber = "21CS042",
  branch = "B.Tech Computer Science",
  semester = "Semester 8",
  triggerButton
}: HallTicketModalProps) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const examSubjects = [
    { code: "CS801", name: "Distributed Systems & Cloud Computing", date: "Oct 18, 2026", time: "09:30 AM - 12:30 PM", room: "Hall 401" },
    { code: "AI602", name: "Deep Learning & Natural Language Processing", date: "Oct 21, 2026", time: "09:30 AM - 12:30 PM", room: "Hall 402" },
    { code: "IT401", name: "Advanced Database Management Systems", date: "Oct 24, 2026", time: "02:00 PM - 05:00 PM", room: "Hall 305" },
    { code: "EC801", name: "VLSI Design & Embedded Architecture", date: "Oct 27, 2026", time: "09:30 AM - 12:30 PM", room: "Hall 401" },
  ];

  const handleDownloadPDF = () => {
    setIsExporting(true);
    toast.loading("Generating Official Hall Ticket PDF...");

    setTimeout(() => {
      const doc = new jsPDF() as any;
      
      // Header & University Branding
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("ATTENDEX INSTITUTE OF TECHNOLOGY", 105, 20, { align: "center" });
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("OFFICIAL SEMESTER EXAMINATION HALL TICKET", 105, 28, { align: "center" });
      doc.text("AUTUMN 2026 END-SEMESTER EXAMS", 105, 34, { align: "center" });

      // Student Info Box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 42, 182, 32, 3, 3, "FD");

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Candidate Name: ${studentName}`, 20, 52);
      doc.text(`University Reg No: ${rollNumber}`, 20, 60);
      doc.text(`Department: ${branch}`, 20, 68);

      doc.text(`Semester: ${semester}`, 120, 52);
      doc.text(`Exam Center: Campus Center Hall`, 120, 60);
      doc.text(`Status: VERIFIED (Eligible)`, 120, 68);

      // Exam Schedule Table
      const tableRows = examSubjects.map(s => [s.code, s.name, s.date, s.time, s.room, "AUTHORIZED"]);

      autoTable(doc, {
        startY: 82,
        head: [['Subject Code', 'Course Title', 'Exam Date', 'Timing', 'Room', 'Status']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
      });

      // Verification Footnote
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("1. Candidates must produce this verified digital token along with official ID card at the examination hall.", 14, finalY);
      doc.text("2. Verification QR code is cryptographically signed by Attendex Controller of Examinations.", 14, finalY + 6);
      
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Controller of Examinations (Sign)", 140, finalY + 20);

      doc.save(`HallTicket_${rollNumber}.pdf`);
      setIsExporting(false);
      toast.dismiss();
      toast.success("Hall Ticket Downloaded Successfully!");
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        triggerButton || (
          <Button className="h-10 px-4 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            <span>Digital Hall Ticket</span>
          </Button>
        )
      } />

      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 bg-white border border-slate-200 text-slate-900 shadow-2xl custom-scrollbar">
        <div className="p-6 md:p-8 space-y-6">
          <DialogHeader className="border-b border-slate-100 pb-4 text-center sm:text-left">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verified Candidate
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Autumn 2026</span>
                </div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  Semester Examination Entry Pass
                </DialogTitle>
              </div>

              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Verification Token</p>
                <p className="text-xs font-mono font-bold text-slate-700">#HT-{rollNumber}</p>
              </div>
            </div>
          </DialogHeader>

          {/* Student Profile & QR Code Header */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-slate-900">{studentName}</h3>
              <p className="text-xs font-medium text-slate-600">Reg No: <span className="font-bold text-slate-900">{rollNumber}</span> • {branch}</p>
              <p className="text-xs text-slate-500 font-medium">{semester} • Campus Center Hall 401</p>
            </div>

            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=ATTENDEX-VERIFIED-CANDIDATE-${rollNumber}`} 
                alt="QR Pass" 
                className="w-20 h-20"
              />
              <span className="text-[9px] font-mono font-semibold text-slate-400 mt-1">SCAN FOR ENTRY</span>
            </div>
          </div>

          {/* Subjects Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Authorized Exam Schedule</h4>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Session</th>
                    <th className="py-2.5 px-3 text-right">Venue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {examSubjects.map((sub) => (
                    <tr key={sub.code} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900">{sub.code}</span>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{sub.name}</p>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">{sub.date}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{sub.time}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-blue-600">{sub.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Guidelines */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold">Institutional Examination Rules:</p>
            <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
              <li>Entry is permitted up to 15 minutes before exam commencement.</li>
              <li>Calculators and formula sheets must comply with university approved models.</li>
            </ul>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="h-10 px-4 rounded-xl border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Pass</span>
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="h-10 px-5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? "Generating..." : "Download Official PDF"}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
