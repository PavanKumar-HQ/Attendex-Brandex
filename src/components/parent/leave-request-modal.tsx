"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, FileText, Send, CheckCircle2, ShieldAlert, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface LeaveRequestModalProps {
  studentName?: string;
  studentRoll?: string;
  triggerButton?: React.ReactElement;
}

export function LeaveRequestModal({ studentName = "Student", studentRoll = "21CS001", triggerButton }: LeaveRequestModalProps) {
  const [open, setOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<"medical" | "personal" | "on_duty" | "emergency">("medical");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !reason.trim()) {
      toast.error("Please fill in all required fields", {
        description: "Specify the start date and valid academic reason."
      });
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast.success("Leave Application Dispatched", {
        description: `Your ${leaveType.toUpperCase()} request has been forwarded to the Class Proctor.`
      });
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setReason("");
        setFromDate("");
        setToDate("");
      }, 1500);
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        triggerButton || (
          <Button className="h-10 px-4 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Apply for Leave</span>
          </Button>
        )
      } />

      <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 overflow-hidden bg-white border border-slate-200 text-slate-900 shadow-xl">
        <div className="p-6 md:p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold w-fit mb-2 border border-blue-100">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Official Institutional Request</span>
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Absence & Exemption Form
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-xs mt-1">
              Submit planned leave or medical exemption for <strong>{studentName}</strong> ({studentRoll}) to prevent attendance shortage penalties.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Application Submitted!</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Your leave application #LEV-{Date.now().toString().slice(-4)} is now queued for faculty review.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Leave Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "medical", label: "Medical Leave (ML)", desc: "Doctor note / sickness" },
                    { id: "on_duty", label: "On Duty (OD)", desc: "Fest / hackathon / sports" },
                    { id: "personal", label: "Personal Leave", desc: "Family commitment" },
                    { id: "emergency", label: "Emergency", desc: "Unplanned absence" },
                  ].map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setLeaveType(t.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        leaveType === t.id
                          ? "border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-xs font-bold">{t.label}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">From Date *</label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-10 rounded-xl border-slate-200 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">To Date</label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-10 rounded-xl border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Reason / Details *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain the reason for absence (e.g. Hospitalized for fever / Attending National Tech Symposium)..."
                  className="w-full h-20 p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-snug">
                  Approved Medical (ML) and On-Duty (OD) leaves will not deduct attendance percentages once verified by the faculty counselor.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="h-10 rounded-xl text-slate-500 font-semibold text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
                >
                  {submitting ? "Transmitting..." : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
