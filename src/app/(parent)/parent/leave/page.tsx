"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { leaveService, LeaveType } from "@/services/leave.service";
import { cn } from "@/lib/utils";

export default function ParentLeavePage() {
  const queryClient = useQueryClient();
  const [leaveType, setLeaveType] = useState<LeaveType>("MEDICAL");
  const [startDate, setStartDate] = useState("2026-09-05");
  const [endDate, setEndDate] = useState("2026-09-07");
  const [reason, setReason] = useState("");

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ["parent-leaves"],
    queryFn: () => leaveService.getStudentLeaves("stud-1"),
    refetchInterval: 10000
  });

  const submitMutation = useMutation({
    mutationFn: () => leaveService.submitLeave({
      studentId: "stud-1",
      studentName: "Rahul Kumar",
      rollNumber: "21CS042",
      leaveType,
      startDate,
      endDate,
      reason
    }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message);
        setReason("");
        queryClient.invalidateQueries({ queryKey: ["parent-leaves"] });
      } else {
        toast.error(res.message);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit leave.");
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => leaveService.cancelLeave(id),
    onSuccess: (res) => {
      toast.info(res.message);
      queryClient.invalidateQueries({ queryKey: ["parent-leaves"] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      toast.error("Please enter a descriptive reason (minimum 5 characters).");
      return;
    }
    submitMutation.mutate();
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

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Condonation Policy</p>
              <p className="text-lg font-bold text-emerald-600">Max 10% Attendance Condoned</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Form (7 cols) */}
            <div className="md:col-span-7 space-y-6">
              <Card className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <FileCheck2 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Submit New Exemption Request</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Exemption Classification</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["MEDICAL", "ON_DUTY", "FAMILY_EMERGENCY", "SPORTS"] as LeaveType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setLeaveType(type)}
                          className={cn(
                            "p-2.5 rounded-lg border text-left font-bold transition-all",
                            leaveType === type
                              ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          {type.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Start Date</label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-10 text-xs rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">End Date</label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-10 text-xs rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Reason / Clinical Diagnosis</label>
                    <Textarea
                      rows={3}
                      placeholder="e.g. High fever with doctor-advised rest. Prescription submitted."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="text-xs rounded-lg"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-sm flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Exemption to Class Teacher</span>
                  </Button>
                </form>
              </Card>
            </div>

            {/* Applications List (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Application History</span>
                <span className="text-xs text-slate-400 font-normal">Auto-Syncing</span>
              </h3>

              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-xs text-slate-400">Loading history...</div>
                ) : leaves.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                    No leave applications recorded.
                  </div>
                ) : (
                  leaves.map((item) => (
                    <Card key={item.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{item.leaveType.replace("_", " ")}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          item.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                          item.status === "REJECTED" ? "bg-rose-100 text-rose-800" :
                          item.status === "CANCELLED" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800"
                        )}>
                          {item.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.startDate} → {item.endDate}</span>
                      </div>

                      <p className="text-slate-600 text-[11px] leading-relaxed">{item.reason}</p>

                      {item.decisionReason && (
                        <div className="p-2 rounded bg-slate-50 border border-slate-100 text-[10px] text-slate-600">
                          <strong>Note:</strong> {item.decisionReason}
                        </div>
                      )}

                      {item.status === "PENDING" && (
                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelMutation.mutate(item.id)}
                            disabled={cancelMutation.isPending}
                            className="text-[11px] text-rose-600 hover:bg-rose-50 h-7 px-2"
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Cancel Request
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
