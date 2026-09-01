"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileCheck2, 
  Send, 
  UploadCloud, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { LeaveRequestModal } from "@/components/parent/leave-request-modal";

const PAST_REQUESTS = [
  {
    id: "LV-201",
    type: "Medical Leave (ML)",
    reason: "Viral fever and doctor-prescribed rest",
    startDate: "Aug 14, 2026",
    endDate: "Aug 16, 2026",
    days: "3 Days",
    status: "Approved",
    approver: "Dr. Pavan Kulkarni (Proctor)",
    attendanceAdjusted: "Attendance credit of 12 hours added"
  },
  {
    id: "LV-189",
    type: "On-Duty (OD) University Representation",
    reason: "Smart India Hackathon 2026 National Finals",
    startDate: "Jul 28, 2026",
    endDate: "Jul 30, 2026",
    days: "3 Days",
    status: "Approved",
    approver: "Dean of Academics",
    attendanceAdjusted: "Attendance credit of 14 hours added"
  }
];

export default function ParentLeavePage() {
  const [leaveType, setLeaveType] = useState("Medical Leave (ML)");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    toast.loading("Transmitting formal absence exemption request...");

    setTimeout(() => {
      setSubmitting(false);
      setReason("");
      toast.dismiss();
      toast.success("Leave Exemption Submitted", {
        description: "Your application has been forwarded to the Class Advisor and Proctor."
      });
    }, 1000);
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full bg-slate-50">
        <Header title="Leave &amp; Medical Exemption Desk" showBack />

        <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          {/* Header Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Official Absence Portal
                </span>
                <span className="text-xs font-semibold text-slate-400">Ward: Rahul Deshmukh (21CS042)</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Absence &amp; Medical Exemption</h1>
              <p className="text-xs text-slate-500 font-medium">
                Submit formal medical certificates, On-Duty authorizations, or emergency leave requests for attendance regularisation.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Condonation Balance</p>
                <p className="text-lg font-bold text-emerald-600">6 Days Available</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Form (7 cols) */}
            <div className="md:col-span-7 space-y-6">
              <Card className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="space-y-1 pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Submit New Exemption Request</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Requests submitted with supporting medical documents are reviewed within 24 hours.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Exemption Category</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option>Medical Leave (ML) with Doctor Certificate</option>
                      <option>On-Duty (OD) Sports / Hackathon Representation</option>
                      <option>Family Emergency / Personal Leave</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Start Date</label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">End Date</label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Detailed Reason for Absence</label>
                    <textarea
                      rows={3}
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please specify medical symptoms, hospital visited, or event details..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer hover:bg-slate-100/60 transition-colors">
                    <UploadCloud className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">Upload Medical Slip / Certificate (PDF/Image)</span>
                    <span className="text-[10px] text-slate-400">Maximum file size: 5MB</span>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? "Submitting..." : "Submit for Faculty Approval"}</span>
                  </Button>
                </form>
              </Card>
            </div>

            {/* History of Past Requests (5 cols) */}
            <div className="md:col-span-5 space-y-6">
              <Card className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Exemption History</h3>

                <div className="space-y-3">
                  {PAST_REQUESTS.map((req) => (
                    <div key={req.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{req.id}</span>
                          <h4 className="text-xs font-bold text-slate-900">{req.type}</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          {req.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-medium">{req.reason}</p>
                      
                      <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-0.5">
                        <p><span className="font-semibold text-slate-700">Duration:</span> {req.startDate} to {req.endDate} ({req.days})</p>
                        <p className="text-emerald-700 font-semibold">{req.attendanceAdjusted}</p>
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
