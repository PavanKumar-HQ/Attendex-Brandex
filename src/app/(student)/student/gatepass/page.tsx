"use client";

import { useState, useEffect } from "react";
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
  UserCheck,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { universalWorkflow } from "@/lib/workflow-engine";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [loading, setLoading] = useState(true);
  const [gatepasses, setGatepasses] = useState<any[]>([]);
  const [studentInfo, setStudentInfo] = useState({
    id: "",
    name: "Rahul Deshmukh",
    rollNumber: "21CS042",
    hostel: "Cauvery Boys Hostel — Block C (Room 304)"
  });

  const loadGatepassHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      let studentId = "";
      if (user) {
        const { data: st } = await supabase
          .from('students')
          .select('id, name, roll_number')
          .eq('auth_user_id', user.id)
          .single();
        if (st) {
          studentId = st.id;
          setStudentInfo(prev => ({
            ...prev,
            id: st.id,
            name: st.name,
            rollNumber: st.roll_number
          }));
        }
      }

      let query = supabase
        .from('gatepasses')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;
      if (!error && data) {
        setGatepasses(data);
      } else {
        setGatepasses([]);
      }
    } catch (err) {
      console.error("Error loading gatepasses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGatepassHistory();
  }, []);

  const activePass = gatepasses.find(g => g.status === 'APPROVED' || g.status === 'PENDING') || null;

  const handleApplyGatepass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !reason) {
      toast.error("Please provide both destination and purpose.");
      return;
    }
    setSubmitting(true);
    const res = await universalWorkflow.submitGatepass({
      studentName: studentInfo.name,
      rollNumber: studentInfo.rollNumber,
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
      loadGatepassHistory();
    } else {
      toast.error(res.message);
    }
  };

  const handleDownloadPDF = () => {
    if (!activePass) {
      toast.error("No active pass to export");
      return;
    }
    try {
      const doc = new jsPDF() as any;
      
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text("ATTENDEX INSTITUTE OF TECHNOLOGY", 105, 20, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("OFFICIAL DIGITAL CAMPUS OUTPASS & GATEPASS", 105, 28, { align: "center" });
      doc.text(`PASS TOKEN #${activePass.id} • STATUS: ${activePass.status}`, 105, 34, { align: "center" });

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 42, 182, 38, 3, 3, "FD");

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Candidate: ${studentInfo.name}`, 20, 52);
      doc.text(`Registration: ${studentInfo.rollNumber}`, 20, 60);
      doc.text(`Hostel / Residence: ${studentInfo.hostel}`, 20, 68);
      doc.text(`Destination: ${activePass.destination || "Hometown"}`, 20, 76);

      doc.text(`Pass Type: ${activePass.category || "Hostel Pass"}`, 110, 52);
      doc.text(`Departure Time: ${activePass.departure_time || "Scheduled"}`, 110, 60);
      doc.text(`Return Deadline: ${activePass.expected_return_time || "Scheduled"}`, 110, 68);
      doc.text(`Approved By: Chief Hostel Warden`, 110, 76);

      const tableRows = [
        ["Authorized Exit Window", String(activePass.departure_time || "N/A"), "Main Security Gate"],
        ["Mandatory In-Time Deadline", String(activePass.expected_return_time || "N/A"), "Hostel Biometric In-Gate"],
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

      doc.save(`Gatepass_${activePass.id}_${studentInfo.rollNumber}.pdf`);
      toast.success("Digital Gatepass PDF Exported!");
    } catch {
      toast.error("Failed to generate Gatepass PDF.");
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full bg-slate-50">
        <Header title="Campus Digital Gatepass & Outpass" showBack />

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
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Digital Outpass & Campus Exit Pass</h1>
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
                disabled={!activePass}
                onClick={handleDownloadPDF}
                className="h-9 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Pass (PDF)</span>
              </Button>
            </div>
          </div>

          {/* Active Verified Pass Showcase Card */}
          {activePass ? (
            <Card className="p-6 md:p-8 rounded-2xl bg-slate-900 text-white shadow-xl overflow-hidden relative">
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="space-y-4 flex-1 text-center lg:text-left">
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {activePass.status}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-mono font-semibold">
                      Pass #{String(activePass.id).slice(0, 8)}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">{activePass.category || "Hostel Pass"}</h2>
                    <p className="text-xs text-slate-400 font-medium mt-1">{studentInfo.name} ({studentInfo.rollNumber}) &bull; {studentInfo.hostel}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400" /> Out-Time (Departure)
                      </span>
                      <p className="font-bold text-white">{activePass.departure_time || "N/A"}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-rose-400" /> Return In-Time Deadline
                      </span>
                      <p className="font-bold text-white">{activePass.expected_return_time || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* QR Verification Pass Box */}
                <div className="p-5 bg-white rounded-2xl text-slate-900 shadow-2xl flex flex-col items-center shrink-0 space-y-2 text-center">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=ATTENDEX-GATEPASS-${activePass.id}-${studentInfo.rollNumber}`} 
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
          ) : (
            <Card className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Ticket className="w-6 h-6 text-slate-400" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">No Active Gatepass</h4>
                  <p className="text-xs text-slate-500">Apply below to generate a digital QR outpass for campus exit.</p>
                </div>
              </div>
            </Card>
          )}

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
                      <label className="text-xs font-bold text-slate-700">Departure Date & Time</label>
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
                      <label className="text-xs font-bold text-slate-700">Expected Return Date & Time</label>
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

                {loading ? (
                  <div className="py-8 flex items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Loading pass history...</span>
                  </div>
                ) : gatepasses.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No previous gatepass records found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gatepasses.map((gp) => (
                      <div key={gp.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">#{String(gp.id).slice(0, 8)}</span>
                            <h4 className="text-xs font-bold text-slate-900">{gp.category || "Hostel Pass"}</h4>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            {gp.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {gp.reason || "Approved Exit"}
                        </p>

                        <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-0.5">
                          <p><span className="font-semibold text-slate-700">Out:</span> {gp.departure_time ? new Date(gp.departure_time).toLocaleString() : "N/A"}</p>
                          <p><span className="font-semibold text-slate-700">In:</span> {gp.expected_return_time ? new Date(gp.expected_return_time).toLocaleString() : "N/A"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

