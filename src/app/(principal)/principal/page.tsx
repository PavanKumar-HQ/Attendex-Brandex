"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileCheck2, 
  Building2, 
  ArrowRight,
  Activity,
  Layers,
  Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { Header } from "@/components/layout/header";
import { universalWorkflow, UniversalLeaveRequest, UniversalGatepassRequest } from "@/lib/workflow-engine";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function PrincipalDashboardPage() {
  const [leaves, setLeaves] = useState<UniversalLeaveRequest[]>([]);
  const [gatepasses, setGatepasses] = useState<UniversalGatepassRequest[]>([]);

  const loadData = () => {
    setLeaves(universalWorkflow.getAllLeaves().filter(l => l.status === "PENDING"));
    setGatepasses(universalWorkflow.getAllGatepasses().filter(g => g.status === "PENDING"));
  };

  useEffect(() => {
    loadData();
    const unsubscribe = universalWorkflow.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const handleApproveLeave = async (id: string) => {
    const res = await universalWorkflow.decideLeave(id, "APPROVED", "Approved by Principal & Institution Head");
    if (res.success) {
      toast.success("Institutional Approval Granted");
      loadData();
    }
  };

  const handleRejectLeave = async (id: string) => {
    const reason = window.prompt("Enter mandatory reason for institutional rejection:");
    if (!reason) return;
    const res = await universalWorkflow.decideLeave(id, "REJECTED", reason);
    if (res.success) {
      toast.info("Request Rejected");
      loadData();
    }
  };

  const totalPending = leaves.length + gatepasses.length;

  return (
    <PageTransition>
      <div className="space-y-6">
        <Header title="Principal Institutional Authority" />

        {/* Executive 4-Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-white border-slate-200/90 shadow-sm rounded-xl space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Students Enrolled</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">1,284</h3>
            <p className="text-xs text-slate-500 font-medium">Active Cohorts across Departments</p>
          </Card>

          <Card className="p-5 bg-white border-slate-200/90 shadow-sm rounded-xl space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Faculty Strength</span>
              <GraduationCap className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">76</h3>
            <p className="text-xs text-slate-500 font-medium">100% Course Allocation Locked</p>
          </Card>

          <Card className="p-5 bg-white border-slate-200/90 shadow-sm rounded-xl space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Campus Attendance</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-3xl font-extrabold text-emerald-700 tracking-tight">89.4%</h3>
            <p className="text-xs text-emerald-600 font-medium">Optimal Institutional Average</p>
          </Card>

          <Card className="p-5 bg-white border-slate-200/90 shadow-sm rounded-xl space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-3xl font-extrabold text-amber-600 tracking-tight">{totalPending}</h3>
            <p className="text-xs text-slate-500 font-medium">Awaiting Principal / Faculty Review</p>
          </Card>
        </div>

        {/* Institutional Authority Queue */}
        <Card className="p-6 bg-white border-slate-200/90 shadow-sm rounded-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Executive Approval & Review Queue</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Centralized clearance for student medical condonations, academic exemptions, and outpasses
              </p>
            </div>
            <span className={cn(
              "text-xs font-bold px-3 py-1 rounded-full border",
              totalPending > 0
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            )}>
              {totalPending} Active Tasks
            </span>
          </div>

          {totalPending === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              ✓ All institutional clearance requests reviewed. Zero pending tasks.
            </div>
          ) : (
            <div className="space-y-3">
              {leaves.map((l) => (
                <div
                  key={l.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                        {l.leaveType} LEAVE
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {l.studentName} ({l.rollNumber})
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">{l.className}</span>
                    </div>
                    <p className="text-slate-600">{l.reason}</p>
                    <p className="text-[11px] font-semibold text-slate-500">
                      Dates: {l.startDate} → {l.endDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectLeave(l.id)}
                      className="h-8 text-rose-600 border-slate-200 hover:bg-rose-50 text-xs font-semibold rounded-lg px-3"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproveLeave(l.id)}
                      className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg px-3"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}

              {gatepasses.map((gp) => (
                <div
                  key={gp.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                        GATEPASS
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {gp.studentName} ({gp.rollNumber})
                      </span>
                    </div>
                    <p className="text-slate-600">Destination: {gp.destination} • {gp.reason}</p>
                    <p className="text-[11px] font-semibold text-slate-500">
                      Exit: {gp.exitTime} • Return: {gp.expectedReturn}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => {
                        universalWorkflow.decideGatepass(gp.id, "APPROVED");
                        toast.success("Gatepass Approved by Principal");
                        loadData();
                      }}
                      className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg px-3"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Authorize Exit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageTransition>
  );
}
