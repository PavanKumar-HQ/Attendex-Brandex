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
  Sparkles,
  UserPlus,
  Plus,
  Mail,
  Lock,
  BadgeCheck
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/ui/page-transition";
import { Header } from "@/components/layout/header";
import { universalWorkflow, UniversalLeaveRequest, UniversalGatepassRequest } from "@/lib/workflow-engine";
import { toast } from "sonner";
import Link from "next/link";
import { cn, formatDateDDMMYYYY } from "@/lib/utils";

export default function PrincipalDashboardPage() {
  const [leaves, setLeaves] = useState<UniversalLeaveRequest[]>([]);
  const [gatepasses, setGatepasses] = useState<UniversalGatepassRequest[]>([]);
  const [pulse, setPulse] = useState({ totalStudents: 0, totalClasses: 0, overallAttendance: 0 });

  // Staff Provisioning State
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [staffForm, setStaffForm] = useState({
    fullName: "",
    email: "",
    role: "TEACHER",
    designation: "Assistant Professor",
    employeeId: "",
    password: ""
  });

  const loadData = async () => {
    try {
      const [leaveRes, gpRes, pulseRes] = await Promise.all([
        fetch("/api/leave"),
        fetch("/api/gatepass"),
        fetch("/api/pulse")
      ]);
      const [leaveJson, gpJson, pulseJson] = await Promise.all([
        leaveRes.json(),
        gpRes.json(),
        pulseRes.json()
      ]);

      if (pulseJson.success) {
        setPulse({
          totalStudents: pulseJson.totalStudents ?? 0,
          totalClasses: pulseJson.totalClasses ?? 0,
          overallAttendance: pulseJson.overallAttendance ?? 0
        });
      }

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

  const handleProvisionStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.fullName.trim() || !staffForm.email.trim()) {
      toast.error("Full Name and Institutional Email are required.");
      return;
    }
    setIsProvisioning(true);
    try {
      const res = await fetch("/api/admin/staff/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Faculty / Staff account provisioned!");
        setIsProvisionOpen(false);
        setStaffForm({
          fullName: "",
          email: "",
          role: "TEACHER",
          designation: "Assistant Professor",
          employeeId: "",
          password: ""
        });
      } else {
        toast.error(data.message || "Failed to provision account.");
      }
    } catch {
      toast.error("Network error while creating staff account.");
    } finally {
      setIsProvisioning(false);
    }
  };

  const totalPending = leaves.length + gatepasses.length;

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Header title="Executive Office" />
          <Button
            onClick={() => setIsProvisionOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm flex items-center gap-2 h-9 px-4 rounded-xl"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision Faculty &amp; Staff</span>
          </Button>
        </div>

        {/* Executive 4-Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 bg-white border-slate-200/90 shadow-sm rounded-xl space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Students Enrolled</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{pulse.totalStudents}</h3>
            <p className="text-xs text-slate-500 font-medium">Active Cohorts across Departments</p>
          </Card>

          <Card className="p-5 bg-white border-slate-200/90 shadow-sm rounded-xl space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Classes &amp; Batches</span>
              <GraduationCap className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{pulse.totalClasses}</h3>
            <p className="text-xs text-slate-500 font-medium">100% Course Allocation Locked</p>
          </Card>

          <Card className="p-5 bg-white border-slate-200/90 shadow-sm rounded-xl space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Campus Attendance</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-3xl font-extrabold text-emerald-700 tracking-tight">{pulse.overallAttendance}%</h3>
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
            <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All institutional clearance requests reviewed. Zero pending tasks.</span>
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
                      Dates: {formatDateDDMMYYYY(l.startDate)} → {formatDateDDMMYYYY(l.endDate)}
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
                      onClick={async () => {
                        await universalWorkflow.decideGatepass(gp.id, "APPROVED");
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

        {/* Staff Provisioning Modal */}
        {isProvisionOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Executive Authority</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Provision Faculty &amp; Staff Account</h3>
                  <p className="text-xs text-slate-500">
                    Create institutional accounts for professors, department heads, or administrators.
                  </p>
                </div>
                <button
                  onClick={() => setIsProvisionOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleProvisionStaff} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Account Role</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "TEACHER", label: "Faculty" },
                      { id: "PRINCIPAL", label: "Principal / HOD" },
                      { id: "ADMIN", label: "Admin" }
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setStaffForm({ ...staffForm, role: r.id })}
                        className={cn(
                          "py-2 text-xs font-bold rounded-lg border transition-all",
                          staffForm.role === r.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
                    <Input
                      required
                      placeholder="e.g. Dr. Ramesh Gupta"
                      value={staffForm.fullName}
                      onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Institutional Email *</Label>
                    <Input
                      required
                      type="email"
                      placeholder="prof.ramesh@college.edu"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Academic Designation</Label>
                    <Input
                      placeholder="e.g. Associate Professor"
                      value={staffForm.designation}
                      onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Employee ID</Label>
                    <Input
                      placeholder="e.g. FAC-2026-042"
                      value={staffForm.employeeId}
                      onChange={(e) => setStaffForm({ ...staffForm, employeeId: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Initial Password</Label>
                  <Input
                    type="password"
                    placeholder="Defaults to ChangeMe@2026 if blank"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    className="h-9 text-xs"
                  />
                  <p className="text-[11px] text-slate-400">
                    The member will be prompted to change their password upon initial login.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsProvisionOpen(false)}
                    disabled={isProvisioning}
                    className="h-9 text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isProvisioning}
                    className="h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isProvisioning ? "Provisioning..." : "Create Account"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
