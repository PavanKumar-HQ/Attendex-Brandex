"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Ticket, 
  QrCode, 
  Download, 
  Printer, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  MapPin, 
  Phone, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Building,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { universalWorkflow } from "@/lib/workflow-engine";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PAST_GATEPASSES = [
  {
    id: "GP-8841",
    type: "Weekend Hostel Pass",
    destination: "Bengaluru (Hometown Visit)",
    outTime: "Aug 22, 2026 • 05:30 PM",
    inTime: "Aug 24, 2026 • 08:00 PM",
    status: "Returned & Verified",
    warden: "Dr. V. Hegde (Chief Warden)",
    gateCheck: "Main Campus Gate 1"
  },
  {
    id: "GP-8720",
    type: "Day Outing Pass",
    destination: "City Central Library & Tech Fair",
    outTime: "Aug 08, 2026 • 10:00 AM",
    inTime: "Aug 08, 2026 • 07:30 PM",
    status: "Punctual Return",
    warden: "Prof. S. Patil",
    gateCheck: "East Campus Gate"
  }
];

export default function StudentGatepassPage() {
  const [passType, setPassType] = useState("Weekend Hostel Pass (Hometown)");
  const [outDate, setOutDate] = useState("");
  const [outTime, setOutTime] = useState("");
  const [inDate, setInDate] = useState("");
  const [inTime, setInTime] = useState("");
  const [destination, setDestination] = useState("");
  const [reason, setReason] = useState("");
  const [guardianContact, setGuardianContact] = useState("+91 98450 67890");
  const [submitting, setSubmitting] = useState(false);
  const [activePass, setActivePass] = useState({
    id: "GP-8994",
    studentName: "Rahul Deshmukh",
    rollNumber: "21CS042",
    hostel: "Cauvery Boys Hostel — Block C (Room 304)",
    type: "Weekend Hometown Outpass",
    destination: "Bengaluru Urban",
    outWindow: "Friday, Oct 09 • 04:30 PM",
    returnDeadline: "Sunday, Oct 11 • 08:30 PM",
    status: "Approved by Warden",
    approvalToken: "AUTH-KLETECH-GP-8994-SEC"
  });

  const handleApplyGatepass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !reason) {
      toast.error("Please provide both destination and purpose.");
      return;
    }
    setSubmitting(true);
    const res = await universalWorkflow.submitGatepass({
      studentName: "Rahul Deshmukh",
      rollNumber: "21CS042",
      exitTime: `${outDate || "Today"} ${outTime || "04:30 PM"}`,
      expectedReturn: `${inDate || "Tomorrow"} ${inTime || "08:00 PM"}`,
      destination,
      reason,
      emergencyContact: guardianContact
    });
    setSubmitting(false);

    if (res.success) {
      toast.success("Gatepass Application Transmitted", {
        description: "Application dispatched to Class Teacher & Campus Security."
      });
      setReason("");
      setDestination("");
    } else {
      toast.error(res.message);
    }
  };

  const handleDownloadPDF = () => {
    toast.loading("Compiling Verified Digital Outpass PDF...");

    setTimeout(() => {
      const doc = new jsPDF() as any;
      
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("ATTENDEX INSTITUTE OF TECHNOLOGY", 105, 20, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("OFFICIAL DIGITAL CAMPUS OUTPASS & GATEPASS", 105, 28, { align: "center" });
      doc.text(`PASS TOKEN #${activePass.id} • STATUS: APPROVED`, 105, 34, { align: "center" });

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 42, 182, 38, 3, 3, "FD");

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Candidate: ${activePass.studentName}`, 20, 52);
      doc.text(`Registration: ${activePass.rollNumber}`, 20, 60);
      doc.text(`Hostel / Residence: ${activePass.hostel}`, 20, 68);
      doc.text(`Destination: ${activePass.destination}`, 20, 76);

      doc.text(`Pass Type: ${activePass.type}`, 110, 52);
      doc.text(`Departure Time: ${activePass.outWindow}`, 110, 60);
      doc.text(`Return Deadline: ${activePass.returnDeadline}`, 110, 68);
      doc.text(`Approved By: Chief Hostel Warden`, 110, 76);

      const tableRows = [
        ["Authorized Exit Window", activePass.outWindow, "Main Security Gate"],
        ["Mandatory In-Time Deadline", activePass.returnDeadline, "Hostel Biometric In-Gate"],
        ["Emergency Guardian Contact", guardianContact, "SMS Verified & Permitted"]
      ];

      autoTable(doc, {
        startY: 88,
        head: [['Checkpoint / Parameter', 'Scheduled Timeline', 'Security Protocol']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 5 },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 18;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("1. Present this QR token at Campus Main Gate for biometric departure scan.", 14, finalY);
      doc.text("2. Failure to report before return deadline will trigger automated SMS alerts to parents.", 14, finalY + 6);

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Chief Warden / Security Officer (Signature)", 125, finalY + 22);

      doc.save(`Gatepass_${activePass.id}_${activePass.rollNumber}.pdf`);
      toast.dismiss();
      toast.success("Digital Gatepass PDF Exported!");
    }, 900);
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full bg-slate-50">
        <Header title="Campus Digital Gatepass &amp; Outpass" showBack />

        <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          {/* Header Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Security System Connected
                </span>
                <span className="text-xs font-semibold text-slate-400">Cauvery Hostel Block C</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Digital Outpass &amp; Campus Exit Pass</h1>
              <p className="text-xs text-slate-500 font-medium">
                Apply for day outing, weekend hometown travel, or medical emergency exit with instant QR verification at security gates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="h-9 px-3 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Pass</span>
              </Button>
              <Button
                onClick={handleDownloadPDF}
                className="h-9 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Pass (PDF)</span>
              </Button>
            </div>
          </div>

          {/* Active Verified Pass Showcase Card */}
          <Card className="p-6 md:p-8 rounded-2xl bg-slate-900 text-white shadow-xl overflow-hidden relative">
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-4 flex-1 text-center lg:text-left">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {activePass.status}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-mono font-semibold">
                    Pass #{activePass.id}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">{activePass.type}</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">{activePass.studentName} ({activePass.rollNumber}) &bull; {activePass.hostel}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" /> Out-Time (Departure)
                    </span>
                    <p className="font-bold text-white">{activePass.outWindow}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-400" /> Return In-Time Deadline
                    </span>
                    <p className="font-bold text-white">{activePass.returnDeadline}</p>
                  </div>
                </div>
              </div>

              {/* QR Verification Pass Box */}
              <div className="p-5 bg-white rounded-2xl text-slate-900 shadow-2xl flex flex-col items-center shrink-0 space-y-2 text-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=ATTENDEX-GATEPASS-${activePass.id}-${activePass.rollNumber}`} 
                  alt="Security QR" 
                  className="w-32 h-32"
                />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block tracking-wider">GATE SCAN QR TOKEN</span>
                  <span className="text-[9px] font-mono text-emerald-600 font-bold">VERIFIED SECURE</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* New Gatepass Application Form (7 cols) */}
            <div className="md:col-span-7 space-y-6">
              <Card className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="space-y-1 pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Apply for New Outpass / Gatepass</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Hostel outpass applications must be submitted at least 4 hours prior to departure.
                  </p>
                </div>

                <form onSubmit={handleApplyGatepass} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Outpass Category</label>
                    <select
                      value={passType}
                      onChange={(e) => setPassType(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option>Weekend Hostel Pass (Hometown)</option>
                      <option>Day Outing Pass (Local City)</option>
                      <option>Medical / Clinic Emergency Exit</option>
                      <option>Academic Project / Industrial Visit</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Departure Date &amp; Time</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          required
                          value={outDate}
                          onChange={(e) => setOutDate(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <input
                          type="time"
                          required
                          value={outTime}
                          onChange={(e) => setOutTime(e.target.value)}
                          className="w-28 h-10 px-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Expected Return Date &amp; Time</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          required
                          value={inDate}
                          onChange={(e) => setInDate(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <input
                          type="time"
                          required
                          value={inTime}
                          onChange={(e) => setInTime(e.target.value)}
                          className="w-28 h-10 px-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Destination Address</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 14th Main, Indiranagar, Bengaluru"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Reason / Purpose of Visit</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Specify purpose of travel..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? "Processing..." : "Submit Gatepass Request"}</span>
                  </Button>
                </form>
              </Card>
            </div>

            {/* Past Gatepasses (5 cols) */}
            <div className="md:col-span-5 space-y-6">
              <Card className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Past Gatepass History</h3>

                <div className="space-y-3">
                  {PAST_GATEPASSES.map((gp) => (
                    <div key={gp.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{gp.id}</span>
                          <h4 className="text-xs font-bold text-slate-900">{gp.type}</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          {gp.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {gp.destination}
                      </p>

                      <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-0.5">
                        <p><span className="font-semibold text-slate-700">Out:</span> {gp.outTime}</p>
                        <p><span className="font-semibold text-slate-700">In:</span> {gp.inTime}</p>
                        <p className="text-slate-400 text-[10px]">{gp.warden} &bull; {gp.gateCheck}</p>
                      </div>
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
