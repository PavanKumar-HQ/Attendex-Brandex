"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileCheck2, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Calendar, 
  ShieldCheck,
  Ban,
  FileText,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { universalWorkflow, UniversalLeaveRequest, LeaveClassification } from "@/lib/workflow-engine";
import { cn, formatDateDDMMYYYY } from "@/lib/utils";

export default function ParentLeavePage() {
  const [leaveType, setLeaveType] = useState<LeaveClassification>("MEDICAL");
  const [startDate, setStartDate] = useState("2026-09-05");
  const [endDate, setEndDate] = useState("2026-09-07");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaves, setLeaves] = useState<UniversalLeaveRequest[]>([]);

  const loadLeaves = async () => {
    try {
      const res = await fetch("/api/leave");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLeaves(json.data);
      } else {
        setLeaves(universalWorkflow.getAllLeaves());
      }
    } catch {
      setLeaves(universalWorkflow.getAllLeaves());
    }
  };

  useEffect(() => {
    loadLeaves();

    // Periodic poll every 5s for cross-port / cross-browser sync
    const interval = setInterval(loadLeaves, 5000);

    // Listen to realtime events across tabs
    const unsubscribe = universalWorkflow.subscribe((event) => {
      if (event.type === "LEAVE_DECIDED") {
        toast.info(`Leave Request ${event.decision}`, {
          description: event.notes || "Class teacher has reviewed your application."
        });
        loadLeaves();
      } else if (event.type === "LEAVE_SUBMITTED" || event.type === "LEAVE_CANCELLED") {
        loadLeaves();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      toast.error("Please enter a descriptive reason (minimum 5 characters).");
      return;
    }

    setIsSubmitting(true);
    const res = await universalWorkflow.submitLeave({
      studentName: "Rahul Deshmukh",
      rollNumber: "21CS042",
      className: "B.Tech CSE - 4A",
      leaveType,
      startDate,
      endDate,
      reason
    });
    setIsSubmitting(false);

    if (res.success) {
      toast.success("Leave Request Submitted!", {
        description: "Application forwarded to Class Teacher Prof. Rajesh Verma for verification."
      });
      setReason("");
      loadLeaves();
    } else {
      toast.error(res.message);
    }
  };

  const handleCancel = (id: string) => {
    const res = universalWorkflow.cancelLeave(id);
    if (res.success) {
      toast.info(res.message);
      loadLeaves();
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full bg-slate-50">
        <Header title="Leave & Medical Exemption Desk" showBack />

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
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Absence & Medical Exemption</h1>
              <p className="text-xs text-slate-500 font-medium">
                Submit formal medical certificates, On-Duty authorizations, or emergency leave requests for attendance regularisation.
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                RD
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900">Rahul Deshmukh</p>
                <p className="text-slate-500 font-mono">21CS042 • B.Tech CSE - 4A</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Submission Form */}
            <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-xl space-y-4 lg:col-span-1">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-blue-600" />
                  <span>Submit New Application</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Routes directly to Assigned Faculty</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-600 text-[11px] block mb-1">Classification</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveClassification)}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="MEDICAL">Medical Leave (Doctor Certificate)</option>
                    <option value="ON_DUTY">On-Duty / Academic Event (OD)</option>
                    <option value="FAMILY_EMERGENCY">Family Emergency</option>
                    <option value="SPORTS">Sports / Inter-Collegiate</option>
                    <option value="CASUAL">Personal / Casual</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-600 text-[11px] block mb-1">From Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 text-[11px] block mb-1">To Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-600 text-[11px] block mb-1">Detailed Explanation</label>
                  
                  {/* Quick-Fill Reason Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      "Severe viral fever with prescribed clinical bed rest.",
                      "Out-of-station family emergency travel.",
                      "Specialist medical consultation and diagnostic checkup.",
                      "Representing university at inter-collegiate sports event."
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setReason(preset)}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors border border-slate-200"
                      >
                        + {preset.slice(0, 24)}...
                      </button>
                    ))}
                  </div>

                  <Textarea
                    placeholder="Provide specific medical diagnosis or event justification..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="text-xs"
                  />
                  <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400">
                    <span>Minimum 5 characters required</span>
                    <span>{reason.length} chars</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm mt-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Transmitting..." : "Submit to Class Teacher"}</span>
                </Button>
              </form>
            </Card>

            {/* 2. Active Application History */}
            <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-xl space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Application History & Decisions</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Authoritative approval records</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {leaves.length} Total Applications
                </span>
              </div>

              {leaves.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No leave requests submitted yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {leaves.map((leave) => {
                    const isPending = leave.status === "PENDING";
                    const isApproved = leave.status === "APPROVED";
                    const isRejected = leave.status === "REJECTED";

                    return (
                      <div
                        key={leave.id}
                        className={cn(
                          "p-4 rounded-xl border text-xs space-y-2 transition-all",
                          isPending
                            ? "bg-amber-50/50 border-amber-200"
                            : isApproved
                            ? "bg-emerald-50/50 border-emerald-200"
                            : isRejected
                            ? "bg-rose-50/50 border-rose-200"
                            : "bg-slate-50 border-slate-200"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              isPending
                                ? "bg-amber-100 text-amber-800"
                                : isApproved
                                ? "bg-emerald-100 text-emerald-800"
                                : isRejected
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-200 text-slate-700"
                            )}>
                              {leave.leaveType.replace("_", " ")}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 font-semibold">
                              #{leave.displayCode || `LV-${leave.id.slice(0, 4).toUpperCase()}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "flex items-center gap-1 font-bold text-[11px]",
                              isPending
                                ? "text-amber-700"
                                : isApproved
                                ? "text-emerald-700"
                                : isRejected
                                ? "text-rose-700"
                                : "text-slate-500"
                            )}>
                              {isPending && <Clock className="w-3.5 h-3.5 animate-spin" />}
                              {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {isRejected && <XCircle className="w-3.5 h-3.5" />}
                              <span>{leave.status}</span>
                            </span>

                            {isPending && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancel(leave.id)}
                                className="h-6 px-2 text-[10px] text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDateDDMMYYYY(leave.startDate)} to {formatDateDDMMYYYY(leave.endDate)}</span>
                          </p>
                          <p className="text-slate-600 mt-1 leading-relaxed">
                            {leave.reason}
                          </p>
                        </div>

                        {leave.reviewedBy && (
                          <div className="pt-2 border-t border-slate-200/80 flex items-start gap-1.5 text-[11px] text-slate-600">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-slate-800">{leave.reviewedBy}: </span>
                              <span>{leave.reviewNotes || "Approved"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
