"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileCheck2, 
  AlertTriangle, 
  Building2, 
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { Header } from "@/components/layout/header";
import { approvalService } from "@/services/approval.service";
import { ApprovalRequest, ApprovalType } from "@/types";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function PrincipalDashboardPage() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<ApprovalType | "ALL">("ALL");

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["principal-approvals"],
    queryFn: () => approvalService.getApprovalRequests("PENDING"),
    refetchInterval: 15000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approvalService.approveRequest(id),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ["principal-approvals"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to approve request.");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => approvalService.rejectRequest(id, reason),
    onSuccess: (res) => {
      toast.info(res.message);
      queryClient.invalidateQueries({ queryKey: ["principal-approvals"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reject request.");
    }
  });

  const filteredApprovals = filterType === "ALL" 
    ? approvals 
    : approvals.filter(a => a.type === filterType);

  const leaveCount = approvals.filter(a => a.type === "LEAVE").length;
  const gatepassCount = approvals.filter(a => a.type === "GATEPASS").length;
  const resultCount = approvals.filter(a => a.type === "RESULT_PUBLICATION").length;
  const promotionCount = approvals.filter(a => a.type === "PROMOTION").length;

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
            <p className="text-xs text-slate-500 font-medium">Active Cohorts across 3 Departments</p>
          </Card>

          <Card className="p-5 bg-white border-slate-200/90 shadow-sm rounded-xl space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Faculty Strength</span>
              <GraduationCap className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">76</h3>
            <p className="text-xs text-slate-500 font-medium">100% Subject Allocations Locked</p>
          </Card>

          <Card className="p-5 bg-white border-slate-200/90 shadow-sm rounded-xl space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Campus Attendance</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-3xl font-extrabold text-emerald-600 tracking-tight">87.4%</h3>
            <p className="text-xs text-emerald-700 font-medium">✓ Institutional Target: ≥85.0%</p>
          </Card>

          <Card className="p-5 bg-slate-900 text-white border-slate-800 shadow-sm rounded-xl space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            </div>
            <h3 className="text-3xl font-extrabold text-amber-400 tracking-tight">{approvals.length || 18}</h3>
            <p className="text-xs text-slate-300 font-medium">Requires Principal Sign-Off</p>
          </Card>
        </div>

        {/* Section: Pending Approvals Queue */}
        <Card className="p-6 bg-white border-slate-200/90 shadow-sm rounded-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Executive Approval Queue</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Authoritative sign-off for student leaves, out-passes, result publications and promotions</p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setFilterType("ALL")}
                className={cn("px-2.5 py-1 rounded-md transition-all", filterType === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
              >
                All ({approvals.length})
              </button>
              <button
                onClick={() => setFilterType("LEAVE")}
                className={cn("px-2.5 py-1 rounded-md transition-all", filterType === "LEAVE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
              >
                Leaves ({leaveCount})
              </button>
              <button
                onClick={() => setFilterType("GATEPASS")}
                className={cn("px-2.5 py-1 rounded-md transition-all", filterType === "GATEPASS" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
              >
                Gatepasses ({gatepassCount})
              </button>
              <button
                onClick={() => setFilterType("RESULT_PUBLICATION")}
                className={cn("px-2.5 py-1 rounded-md transition-all", filterType === "RESULT_PUBLICATION" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
              >
                Results ({resultCount})
              </button>
              <button
                onClick={() => setFilterType("PROMOTION")}
                className={cn("px-2.5 py-1 rounded-md transition-all", filterType === "PROMOTION" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
              >
                Promotions ({promotionCount})
              </button>
            </div>
          </div>

          {/* List of Approval Items */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500 font-semibold">Loading approval ledger...</div>
            ) : filteredApprovals.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 font-semibold bg-slate-50 rounded-lg border border-dashed border-slate-200">
                ✓ All institutional approval requests have been processed. Zero pending items.
              </div>
            ) : (
              filteredApprovals.map((req) => (
                <div key={req.id} className="p-4 bg-slate-50 hover:bg-slate-50/80 rounded-xl border border-slate-200/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                        req.type === "LEAVE" ? "bg-amber-100 text-amber-800" :
                        req.type === "GATEPASS" ? "bg-blue-100 text-blue-800" :
                        req.type === "RESULT_PUBLICATION" ? "bg-purple-100 text-purple-800" : "bg-emerald-100 text-emerald-800"
                      )}>
                        {req.type.replace("_", " ")}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">• {req.createdAt}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{req.title}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span>Requester: <strong className="text-slate-900">{req.requesterName}</strong> ({req.requesterRole})</span>
                      <span>•</span>
                      <span>Dept: <strong className="text-slate-900">{req.department}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(req.id)}
                      disabled={approveMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg h-9 px-4 flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectMutation.mutate({ id: req.id, reason: "Documentation incomplete." })}
                      disabled={rejectMutation.isPending}
                      className="border-slate-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg h-9 px-3 flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Section: Academic Oversight & College Management */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white border-slate-200/90 shadow-sm rounded-xl space-y-4 md:col-span-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Academic Oversight & Management</span>
              </h3>
              <Link href="/pulse" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                <span>View Full Telemetry</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link href="/students" className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/70 transition-all block">
                <span className="text-xs font-bold text-slate-900 block">Student Roster</span>
                <span className="text-[11px] text-slate-500">1,284 Profiles • 100% KYC</span>
              </Link>

              <Link href="/classes" className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/70 transition-all block">
                <span className="text-xs font-bold text-slate-900 block">Class Cohorts</span>
                <span className="text-[11px] text-slate-500">12 Active Sections</span>
              </Link>

              <Link href="/subjects" className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/70 transition-all block">
                <span className="text-xs font-bold text-slate-900 block">Curriculum Courses</span>
                <span className="text-[11px] text-slate-500">28 Active Syllabus Modules</span>
              </Link>

              <Link href="/results/manage" className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/70 transition-all block">
                <span className="text-xs font-bold text-slate-900 block">Marks & CIA Ledger</span>
                <span className="text-[11px] text-slate-500">Continuous Assessment Review</span>
              </Link>

              <Link href="/promotion" className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/70 transition-all block">
                <span className="text-xs font-bold text-slate-900 block">Batch Promotion</span>
                <span className="text-[11px] text-slate-500">Semester Progression Engine</span>
              </Link>

              <Link href="/parent/fees" className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/70 transition-all block">
                <span className="text-xs font-bold text-slate-900 block">Institutional Fees</span>
                <span className="text-[11px] text-slate-500">Tuition & Accounts Status</span>
              </Link>
            </div>
          </Card>

          {/* Section: Live Audit Stream */}
          <Card className="p-6 bg-white border-slate-200/90 shadow-sm rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Institutional Audit Ledger</h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Tamper-Proof
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <p className="font-semibold text-slate-800">Roll-call finalization for CSE 4A</p>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Prof. Rajesh V.</span>
                  <span>10m ago</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <p className="font-semibold text-slate-800">Condonation approved for 21CS042</p>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Principal Office</span>
                  <span>45m ago</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <p className="font-semibold text-slate-800">3 Defaulter Guardian SMS Dispatched</p>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Automated System</span>
                  <span>1h ago</span>
                </div>
              </div>
            </div>

            <Link href="/audit" className="block text-center text-xs font-semibold text-blue-600 hover:underline pt-2 border-t border-slate-100">
              View Complete Regulatory Audit Log →
            </Link>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
