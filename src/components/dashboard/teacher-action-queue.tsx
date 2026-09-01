"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, XCircle, Clock, FileText, Calendar, QrCode } from "lucide-react";
import { universalWorkflow, UniversalLeaveRequest, UniversalGatepassRequest } from "@/lib/workflow-engine";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function TeacherActionQueue() {
  const [leaves, setLeaves] = useState<UniversalLeaveRequest[]>([]);
  const [gatepasses, setGatepasses] = useState<UniversalGatepassRequest[]>([]);

  const loadData = async () => {
    // 1. Try real server API
    try {
      const [leaveRes, gpRes] = await Promise.all([
        fetch("/api/leave"),
        fetch("/api/gatepass")
      ]);
      const [leaveJson, gpJson] = await Promise.all([
        leaveRes.json(),
        gpRes.json()
      ]);

      if (leaveJson.success && Array.isArray(leaveJson.data)) {
        setLeaves(leaveJson.data.filter((l: any) => l.status === "PENDING"));
      } else {
        setLeaves(universalWorkflow.getAllLeaves().filter(l => l.status === "PENDING"));
      }

      if (gpJson.success && Array.isArray(gpJson.data)) {
        setGatepasses(gpJson.data.filter((g: any) => g.status === "PENDING"));
      } else {
        setGatepasses(universalWorkflow.getAllGatepasses().filter(g => g.status === "PENDING"));
      }
    } catch {
      setLeaves(universalWorkflow.getAllLeaves().filter(l => l.status === "PENDING"));
      setGatepasses(universalWorkflow.getAllGatepasses().filter(g => g.status === "PENDING"));
    }
  };

  useEffect(() => {
    loadData();

    // Periodic poll every 5s for cross-port / cross-browser sync
    const interval = setInterval(loadData, 5000);

    // Subscribe to cross-tab & cross-portal realtime events
    const unsubscribe = universalWorkflow.subscribe((event) => {
      if (event.type === "LEAVE_SUBMITTED") {
        toast.info("New Leave Request Received", {
          description: `${event.payload.studentName} (${event.payload.rollNumber}) applied for ${event.payload.leaveType.toLowerCase()} leave.`
        });
        loadData();
      } else if (event.type === "GATEPASS_SUBMITTED") {
        toast.info("New Gatepass Request Received", {
          description: `${event.payload.studentName} requested gatepass to ${event.payload.destination}.`
        });
        loadData();
      } else if (event.type === "LEAVE_DECIDED" || event.type === "GATEPASS_DECIDED" || event.type === "LEAVE_CANCELLED") {
        loadData();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const handleLeaveDecision = async (leaveId: string, decision: "APPROVED" | "REJECTED") => {
    let notes: string | undefined = undefined;
    if (decision === "REJECTED") {
      const input = window.prompt("Enter mandatory reason for rejection:");
      if (!input || input.trim().length === 0) {
        toast.error("Rejection cancelled: Reason is mandatory.");
        return;
      }
      notes = input.trim();
    }

    const res = await universalWorkflow.decideLeave(leaveId, decision, notes);
    if (res.success) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.message);
    }
  };

  const handleGatepassDecision = async (gpId: string, decision: "APPROVED" | "REJECTED") => {
    const res = await universalWorkflow.decideGatepass(gpId, decision);
    if (res.success) {
      toast.success(res.message);
      loadData();
    }
  };

  const totalPending = leaves.length + gatepasses.length;

  return (
    <Card className="p-6 border-slate-200 shadow-sm rounded-xl bg-white space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Assigned Action Items & Approvals</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Parent medical exemptions & student gatepass requests awaiting your review
          </p>
        </div>
        <span className={cn(
          "text-xs font-bold px-2.5 py-1 rounded-full border",
          totalPending > 0 
            ? "text-amber-700 bg-amber-50 border-amber-200 animate-pulse"
            : "text-emerald-700 bg-emerald-50 border-emerald-200"
        )}>
          {totalPending > 0 ? `${totalPending} Pending Review` : "0 Pending"}
        </span>
      </div>

      {totalPending === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
          ✓ All student exemption requests and gatepass items processed. Zero pending tasks.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Leaves */}
          {leaves.map((leave) => (
            <div
              key={leave.id}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5 text-xs flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                    {leave.leaveType.replace("_", " ")} LEAVE
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Just now</span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {leave.studentName} ({leave.rollNumber})
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{leave.startDate} → {leave.endDate}</span>
                  </p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {leave.reason}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleLeaveDecision(leave.id, "REJECTED")}
                  className="h-8 text-rose-600 border-slate-200 hover:bg-rose-50 text-xs font-semibold rounded-lg px-3"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleLeaveDecision(leave.id, "APPROVED")}
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg px-3 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve
                </Button>
              </div>
            </div>
          ))}

          {/* Gatepasses */}
          {gatepasses.map((gp) => (
            <div
              key={gp.id}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5 text-xs flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                    CAMPUS GATEPASS
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Pending Gate Exit</span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {gp.studentName} ({gp.rollNumber})
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-600">
                    Exit: {gp.exitTime} • Return: {gp.expectedReturn}
                  </p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Destination: {gp.destination} • {gp.reason}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Parent Contact: {gp.emergencyContact}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGatepassDecision(gp.id, "REJECTED")}
                  className="h-8 text-rose-600 border-slate-200 hover:bg-rose-50 text-xs font-semibold rounded-lg px-3"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleGatepassDecision(gp.id, "APPROVED")}
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg px-3 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve Gatepass
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
