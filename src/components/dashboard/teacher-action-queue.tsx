"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  UserCheck, 
  Phone,
  MessageSquare,
  Lock,
  Check,
  X
} from "lucide-react";
import { universalWorkflow, UniversalLeaveRequest, UniversalGatepassRequest } from "@/lib/workflow-engine";
import { toast } from "sonner";
import { cn, formatDateDDMMYYYY } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ProctorQueueItem {
  id: string;
  displayCode: string;
  studentName: string;
  rollNumber: string;
  className: string;
  topic: string;
  message: string;
  preferredTime?: string;
  contactPhone?: string;
  status: "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt: string;
}

interface SlotItem {
  slot: string;
  isBlocked: boolean;
  bookedByStudent?: string;
  topic?: string;
}

export function TeacherActionQueue() {
  const [leaves, setLeaves] = useState<UniversalLeaveRequest[]>([]);
  const [gatepasses, setGatepasses] = useState<UniversalGatepassRequest[]>([]);
  const [proctorRequests, setProctorRequests] = useState<ProctorQueueItem[]>([]);

  // Scheduling Modal State
  const [activeSchedulingItem, setActiveSchedulingItem] = useState<ProctorQueueItem | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [scheduleSlot, setScheduleSlot] = useState<string>("03:30 PM – 04:00 PM");
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  const loadData = async () => {
    try {
      const [leaveRes, gpRes, proctorRes] = await Promise.all([
        fetch("/api/leave"),
        fetch("/api/gatepass"),
        fetch("/api/proctor")
      ]);
      const [leaveJson, gpJson, proctorJson] = await Promise.all([
        leaveRes.json(),
        gpRes.json(),
        proctorRes.json()
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

      if (proctorJson.success && Array.isArray(proctorJson.data)) {
        setProctorRequests(proctorJson.data.filter((p: any) => p.status === "PENDING"));
      }
    } catch {
      setLeaves(universalWorkflow.getAllLeaves().filter(l => l.status === "PENDING"));
      setGatepasses(universalWorkflow.getAllGatepasses().filter(g => g.status === "PENDING"));
    }
  };

  const loadSlotsForDate = async (date: string, excludeId?: string) => {
    setSlotsLoading(true);
    try {
      const url = `/api/proctor/slots?date=${date}${excludeId ? `&excludeId=${excludeId}` : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.slots)) {
        setSlots(json.slots);
        const openSlot = json.slots.find((s: SlotItem) => !s.isBlocked);
        if (openSlot) {
          setScheduleSlot(openSlot.slot);
        }
      }
    } catch {
      // Ignore
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);

    const unsubscribe = universalWorkflow.subscribe((event) => {
      if (event.type === "LEAVE_SUBMITTED") {
        toast.info("New Leave Request Received", {
          description: `${event.payload.studentName} (${event.payload.rollNumber}) applied for ${event.payload.leaveType?.toLowerCase?.() || 'absence'} leave.`
        });
        loadData();
      } else if (event.type === "GATEPASS_SUBMITTED") {
        toast.info("New Gatepass Request Received", {
          description: `${event.payload.studentName} requested gatepass to ${event.payload.destination}.`
        });
        loadData();
      } else if (event.type === "PROCTOR_REQUEST_SUBMITTED") {
        toast.info("New Proctor Consultation Request", {
          description: `${event.payload.studentName} (${event.payload.rollNumber}) booked slot for ${event.payload.topic}.`
        });
        loadData();
      } else if (event.type === "LEAVE_DECIDED" || event.type === "GATEPASS_DECIDED" || event.type === "LEAVE_CANCELLED" || event.type === "PROCTOR_REQUEST_DECIDED") {
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

    try {
      const res = await fetch("/api/leave/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, decision, notes, decidedBy: "Dr. S. Kulkarni" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Leave ${decision.toLowerCase()} successfully`);
        await loadData();
      } else {
        const fallbackRes = await universalWorkflow.decideLeave(leaveId, decision, notes);
        if (fallbackRes.success) {
          toast.success(fallbackRes.message);
          await loadData();
        } else {
          toast.error(data.message || fallbackRes.message);
        }
      }
    } catch {
      const fallbackRes = await universalWorkflow.decideLeave(leaveId, decision, notes);
      if (fallbackRes.success) {
        toast.success(fallbackRes.message);
        await loadData();
      } else {
        toast.error(fallbackRes.message);
      }
    }
  };

  const handleGatepassDecision = async (gpId: string, decision: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/gatepass/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gatepassId: gpId, decision, decidedBy: "Dr. S. Kulkarni" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || `Gatepass ${decision.toLowerCase()} successfully`);
        await loadData();
      } else {
        const fallbackRes = await universalWorkflow.decideGatepass(gpId, decision);
        if (fallbackRes.success) {
          toast.success(fallbackRes.message);
          await loadData();
        }
      }
    } catch {
      const fallbackRes = await universalWorkflow.decideGatepass(gpId, decision);
      if (fallbackRes.success) {
        toast.success(fallbackRes.message);
        await loadData();
      }
    }
  };

  const openScheduleModal = (item: ProctorQueueItem) => {
    setActiveSchedulingItem(item);
    const date = item.scheduledDate || new Date().toISOString().split("T")[0];
    setScheduleDate(date);
    loadSlotsForDate(date, item.id);
  };

  const confirmScheduleSlot = async () => {
    if (!activeSchedulingItem) return;
    setIsSubmittingSchedule(true);
    try {
      const res = await fetch("/api/proctor/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: activeSchedulingItem.id,
          action: "SCHEDULED",
          scheduledDate: scheduleDate,
          scheduledTime: scheduleSlot,
          meetingNotes: `Consultation slot confirmed for ${scheduleSlot} in CS Block Room 304.`
        })
      });

      const data = await res.json();
      if (data.success) {
        universalWorkflow.emitEvent({
          type: "PROCTOR_REQUEST_DECIDED",
          requestId: activeSchedulingItem.id,
          action: "SCHEDULED",
          scheduledDate: scheduleDate,
          scheduledTime: scheduleSlot,
          notes: `Consultation slot confirmed for ${scheduleSlot} in CS Block Room 304.`
        });
        toast.success(`Slot Confirmed: ${scheduleSlot}`, {
          description: `Meeting confirmed with ${activeSchedulingItem.studentName} on ${formatDateDDMMYYYY(scheduleDate)}.`
        });
        setActiveSchedulingItem(null);
        await loadData();
      } else {
        toast.error(data.message || "Failed to schedule slot.");
        await loadSlotsForDate(scheduleDate, activeSchedulingItem.id);
      }
    } catch {
      toast.error("Network error while confirming slot.");
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleResolveProctor = async (requestId: string) => {
    try {
      const res = await fetch("/api/proctor/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: "COMPLETED",
          meetingNotes: "Proctor consultation completed. Attendance shortage intervention and remedial plan logged."
        })
      });
      const data = await res.json();
      if (data.success) {
        universalWorkflow.emitEvent({
          type: "PROCTOR_REQUEST_DECIDED",
          requestId,
          action: "COMPLETED",
          notes: "Proctor consultation completed and logged in institutional audit registry."
        });
        toast.success("Consultation Resolved & Logged", {
          description: "Meeting outcome archived in institutional audit registry."
        });
        await loadData();
      }
    } catch {
      toast.error("Failed to resolve proctor request.");
    }
  };

  const totalPending = leaves.length + gatepasses.length + proctorRequests.length;

  return (
    <>
      <Card className="p-6 border-slate-200 shadow-sm rounded-xl bg-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Assigned Action Items & Approvals</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Parent medical exemptions, student gatepasses & proctor advisory callbacks awaiting your review
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
            ✓ All student exemption requests, gatepass items, and proctor consultation queries processed. Zero pending tasks.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <span>{formatDateDDMMYYYY(leave.startDate)} → {formatDateDDMMYYYY(leave.endDate)}</span>
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

            {/* Proctor Consultation Requests */}
            {proctorRequests.map((pr) => (
              <div
                key={pr.id}
                className="p-4 bg-purple-50/50 rounded-xl border border-purple-200/80 space-y-2.5 text-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> PROCTOR ADVISORY
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">#{pr.displayCode}</span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {pr.studentName} ({pr.rollNumber})
                    </h4>
                    <p className="text-[11px] font-bold text-purple-900">
                      Topic: {pr.topic}
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {pr.message}
                    </p>
                    <div className="pt-1 flex flex-col gap-0.5 text-[10px] text-slate-500 font-medium">
                      <span>Requested Slot: {pr.preferredTime || "Office Hours"}</span>
                      {pr.contactPhone && <span className="font-mono text-slate-700">Phone: {pr.contactPhone}</span>}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-200 flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openScheduleModal(pr)}
                    className="h-8 text-purple-700 border-purple-200 hover:bg-purple-100 text-xs font-semibold rounded-lg px-2.5"
                  >
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Pick Open Slot
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleResolveProctor(pr.id)}
                    className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg px-2.5 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolve / Log
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Proctor Slot Scheduling Modal with Collision Shield */}
      <Dialog open={Boolean(activeSchedulingItem)} onOpenChange={(open) => !open && setActiveSchedulingItem(null)}>
        {activeSchedulingItem && (
          <DialogContent className="sm:max-w-lg p-6 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-2xl space-y-4">
            <DialogHeader className="space-y-1 pb-3 border-b border-slate-100">
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Schedule Consultation Slot</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                Confirm meeting with <strong className="text-slate-900">{activeSchedulingItem.studentName}</strong> ({activeSchedulingItem.rollNumber})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-purple-50/80 rounded-xl border border-purple-200 text-purple-950 space-y-1">
                <p className="font-bold flex items-center justify-between">
                  <span>Topic: {activeSchedulingItem.topic}</span>
                  <span className="font-mono text-[10px] text-purple-600 font-semibold">#{activeSchedulingItem.displayCode}</span>
                </p>
                <p className="text-xs text-purple-800 leading-relaxed font-medium">"{activeSchedulingItem.message}"</p>
                {activeSchedulingItem.contactPhone && (
                  <p className="text-[11px] text-purple-700 font-mono pt-1 border-t border-purple-200/60 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-purple-500" />
                    <span>Callback Contact: <strong>{activeSchedulingItem.contactPhone}</strong></span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Consultation Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => {
                    setScheduleDate(e.target.value);
                    loadSlotsForDate(e.target.value, activeSchedulingItem.id);
                  }}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Available Time Slots</label>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {slotsLoading ? "Checking collision..." : "Zero-Collision Protected"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {slots.map((s) => {
                    const isSelected = scheduleSlot === s.slot && !s.isBlocked;
                    return (
                      <button
                        key={s.slot}
                        type="button"
                        disabled={s.isBlocked}
                        onClick={() => setScheduleSlot(s.slot)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left text-xs transition-all relative flex flex-col justify-between min-h-[58px]",
                          s.isBlocked
                            ? "bg-slate-100/90 border-slate-200 text-slate-400 cursor-not-allowed opacity-75"
                            : isSelected
                            ? "bg-purple-600 border-purple-600 text-white shadow-sm ring-2 ring-purple-600/30"
                            : "bg-white border-slate-200 hover:border-purple-300 text-slate-800 hover:bg-purple-50/50"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={cn("font-bold text-[11px]", isSelected ? "text-white" : s.isBlocked ? "text-slate-400" : "text-slate-900")}>
                            {s.slot}
                          </span>
                          {s.isBlocked ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-bold flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Booked
                            </span>
                          ) : isSelected ? (
                            <span className="w-4 h-4 rounded-full bg-white text-purple-600 flex items-center justify-center font-bold">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-semibold border border-emerald-200">
                              Open
                            </span>
                          )}
                        </div>
                        <span className={cn("text-[10px]", isSelected ? "text-purple-100" : s.isBlocked ? "text-slate-400" : "text-slate-500")}>
                          {s.isBlocked ? (s.bookedByStudent ? `Reserved (${s.bookedByStudent.slice(0, 14)}...)` : "Slot Blocked") : "No Overlap"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setActiveSchedulingItem(null)}
                className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                disabled={isSubmittingSchedule || !scheduleSlot}
                onClick={confirmScheduleSlot}
                className="h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSubmittingSchedule ? "Confirming..." : "Confirm & Reserve Slot"}</span>
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
