"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, FileText, Send, CheckCircle2, ShieldAlert, AlertCircle, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { universalWorkflow, LeaveClassification } from "@/lib/workflow-engine";
import Link from "next/link";

interface LeaveRequestModalProps {
  studentName?: string;
  studentRoll?: string;
  triggerButton?: React.ReactElement;
}

export function LeaveRequestModal({ studentName = "Rahul Deshmukh", studentRoll = "21CS042", triggerButton }: LeaveRequestModalProps) {
  const [open, setOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveClassification>("MEDICAL");
  const [fromDate, setFromDate] = useState("2026-09-08");
  const [toDate, setToDate] = useState("2026-09-10");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmedCode, setConfirmedCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !reason.trim() || reason.trim().length < 5) {
      toast.error("Please enter a valid reason (minimum 5 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await universalWorkflow.submitLeave({
        studentName,
        rollNumber: studentRoll,
        className: "B.Tech CSE - 4A",
        leaveType,
        startDate: fromDate,
        endDate: toDate || fromDate,
        reason: reason.trim()
      });

      if (res.success) {
        setConfirmedCode(res.displayCode);
        setSubmitted(true);
        toast.success("Leave Application Registered!", {
          description: `Dispatched to Class Teacher Prof. Rajesh Verma (#${res.displayCode}).`
        });
        setTimeout(() => {
          setOpen(false);
          setSubmitted(false);
          setReason("");
        }, 2000);
      } else {
        toast.error(res.message || "Failed to submit leave.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold w-fit border border-blue-100">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Official Absence Portal</span>
              </div>
              <Link 
                href="/parent/leave"
                onClick={() => setOpen(false)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                <span>Full Desk</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 mt-2">
              Absence &amp; Medical Exemption Form
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-xs mt-1">
              Submit planned leave or medical exemption for <strong>{studentName}</strong> ({studentRoll}) directly to faculty.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Application Submitted!</h3>
              <p className="text-xs text-slate-500 max-w-xs font-medium">
                Your leave application <strong className="text-slate-900">#{confirmedCode}</strong> is now live in the Class Teacher's action queue.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Leave Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "MEDICAL", label: "Medical Leave (ML)", desc: "Doctor certificate / fever" },
                    { id: "ON_DUTY", label: "On Duty (OD)", desc: "Tech fest / hackathon / sports" },
                    { id: "CASUAL", label: "Personal Leave", desc: "Family emergency / travel" },
                    { id: "SPORTS", label: "Sports Meet", desc: "Inter-collegiate event" },
                  ].map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setLeaveType(t.id as LeaveClassification)}
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
                  <label className="text-xs font-semibold text-slate-700">To Date *</label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-10 rounded-xl border-slate-200 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Reason / Details *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain the clinical reason or official event (e.g. Prescribed bed rest for viral fever / Representing college in robotics hackathon)..."
                  className="w-full h-20 p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                  required
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>Minimum 5 characters required</span>
                  <span>{reason.length} chars</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-snug">
                  Approved Medical (ML) and On-Duty (OD) leaves will regularize attendance percentages once verified by faculty counselor.
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
