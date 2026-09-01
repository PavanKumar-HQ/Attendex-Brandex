"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  QrCode, 
  Download, 
  Printer, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  Clock, 
  AlertCircle, 
  FileCheck,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function StudentHallTicketPage() {
  const [isExporting, setIsExporting] = useState(false);

  const student = {
    name: "Rahul Deshmukh",
    rollNumber: "21CS042",
    branch: "B.Tech Computer Science & Engineering",
    semester: "Semester 8",
    center: "Campus Center Examination Hall 401",
    attendance: 91.4,
    status: "Eligible (Verified)"
  };

  const examSubjects = [
    { code: "CS801", name: "Distributed Systems & Cloud Computing", date: "Oct 18, 2026", time: "09:30 AM - 12:30 PM", room: "Hall 401", invigilator: "Verified" },
    { code: "AI602", name: "Deep Learning & Natural Language Processing", date: "Oct 21, 2026", time: "09:30 AM - 12:30 PM", room: "Hall 402", invigilator: "Verified" },
    { code: "IT401", name: "Advanced Database Management Systems", date: "Oct 24, 2026", time: "02:00 PM - 05:00 PM", room: "Hall 305", invigilator: "Verified" },
    { code: "EC801", name: "VLSI Design & Hardware Architecture", date: "Oct 27, 2026", time: "09:30 AM - 12:30 PM", room: "Hall 401", invigilator: "Verified" },
  ];

  const handleDownloadPDF = () => {
    setIsExporting(true);
    toast.loading("Compiling Official Examination Hall Ticket...");

    setTimeout(() => {
      const doc = new jsPDF() as any;
      
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("ATTENDEX INSTITUTE OF TECHNOLOGY", 105, 20, { align: "center" });
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("OFFICIAL END-SEMESTER EXAMINATION HALL TICKET", 105, 28, { align: "center" });
      doc.text("AUTUMN 2026 ACADEMIC SESSION", 105, 34, { align: "center" });

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 42, 182, 32, 3, 3, "FD");

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Candidate: ${student.name}`, 20, 52);
      doc.text(`University Reg No: ${student.rollNumber}`, 20, 60);
      doc.text(`Department: ${student.branch}`, 20, 68);

      doc.text(`Semester: ${student.semester}`, 120, 52);
      doc.text(`Exam Center: ${student.center}`, 120, 60);
      doc.text(`Clearance Status: ${student.status}`, 120, 68);

      const tableRows = examSubjects.map(s => [s.code, s.name, s.date, s.time, s.room, "AUTHORIZED"]);

      autoTable(doc, {
        startY: 82,
        head: [['Subject Code', 'Course Title', 'Exam Date', 'Timing', 'Room', 'Status']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 18;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("1. Candidates must present this verified admit pass with institution ID at entrance gates.", 14, finalY);
      doc.text("2. Verification QR is cryptographically signed by Attendex Examination Controller.", 14, finalY + 6);
      
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Controller of Examinations (Sign)", 140, finalY + 20);

      doc.save(`HallTicket_${student.rollNumber}.pdf`);
      setIsExporting(false);
      toast.dismiss();
      toast.success("Official Hall Ticket PDF Downloaded!");
    }, 1000);
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full bg-slate-50">
        <Header title="Semester Hall Ticket &amp; Entry Pass" showBack />

        <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          {/* Admit Pass Card */}
          <Card className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Examination Verified
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Token #HT-{student.rollNumber}</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Official Semester Examination Pass</h1>
                <p className="text-xs text-slate-500 font-medium">
                  Valid for entry into Autumn 2026 End-Semester Examinations at KLE Tech Campus.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="h-9 px-3 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={isExporting}
                  className="h-9 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? "Generating..." : "Download Official PDF"}</span>
                </Button>
              </div>
            </div>

            {/* Candidate Box */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left flex-1">
                <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <p><span className="font-semibold text-slate-800">Registration No:</span> {student.rollNumber}</p>
                  <p><span className="font-semibold text-slate-800">Branch:</span> {student.branch}</p>
                  <p><span className="font-semibold text-slate-800">Semester:</span> {student.semester}</p>
                  <p><span className="font-semibold text-slate-800">Venue:</span> {student.center}</p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center shrink-0">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=ATTENDEX-VERIFIED-PASS-${student.rollNumber}`} 
                  alt="QR Token" 
                  className="w-24 h-24"
                />
                <span className="text-[9px] font-mono font-bold text-slate-400 mt-1">VERIFIED QR PASS</span>
              </div>
            </div>

            {/* Examination Schedule */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Authorized Exam Paper Schedule</h3>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Session Timing</th>
                      <th className="py-3 px-4 text-right">Hall / Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {examSubjects.map((sub) => (
                      <tr key={sub.code} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">{sub.code}</span>
                          <p className="text-xs text-slate-500">{sub.name}</p>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">{sub.date}</td>
                        <td className="py-3 px-4 text-slate-600">{sub.time}</td>
                        <td className="py-3 px-4 text-right font-bold text-blue-600">{sub.room}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Exam Guidelines */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Mandatory Examination Instructions:
              </p>
              <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
                <li>Students must report to their assigned examination hall 20 minutes prior to session commencement.</li>
                <li>Digital smartwatches and unapproved electronic devices are strictly prohibited in the exam hall.</li>
                <li>Verification token must match your physical university ID card.</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
