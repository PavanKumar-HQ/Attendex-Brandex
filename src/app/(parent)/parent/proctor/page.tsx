"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  MessageSquare, 
  Building2,
  Send,
  AlertCircle,
  Lock,
  Check,
  PhoneCall,
  Copy,
  ExternalLink,
  PhoneForwarded,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { formatDateDDMMYYYY, cn } from "@/lib/utils";
import { universalWorkflow } from "@/lib/workflow-engine";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SlotItem {
  slot: string;
  isBlocked: boolean;
  bookedByStudent?: string;
  topic?: string;
}

interface ProctorRequestItem {
  id: string;
  displayCode: string;
  studentName: string;
  rollNumber: string;
  topic: string;
  message: string;
  preferredTime?: string;
  contactPhone?: string;
  status: "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  scheduledDate?: string;
  scheduledTime?: string;
  meetingNotes?: string;
  actionItems?: string;
  createdAt: string;
}

export default function ParentProctorPage() {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(tomorrow);
  const [selectedSlot, setSelectedSlot] = useState("03:30 PM – 04:00 PM");
  const [topic, setTopic] = useState("Academic Attendance & CIA Feedback");
  const [message, setMessage] = useState("");
  const [contactPhone, setContactPhone] = useState("+91 98450 12345");
  const [submitting, setSubmitting] = useState(false);
  
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [requests, setRequests] = useState<ProctorRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Call Cabin Modal state
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  const proctor = {
    name: "Dr. Pavan Kulkarni",
    designation: "Professor & Designated Proctor Advisor",
    department: "Department of Computer Science & Engineering",
    email: "pavan.kulkarni@attendex.edu",
    phone: "+91 98450 12345",
    extension: "Ext. 304",
    cabin: "CS Block, Room 304 (3rd Floor)",
    hours: "Monday to Friday (3:30 PM – 5:00 PM)"
  };

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(proctor.phone);
      setCopiedNumber(true);
      toast.success("Phone number copied to clipboard!", {
        description: `${proctor.phone} (${proctor.name})`
      });
      setTimeout(() => setCopiedNumber(false), 2500);
    } catch {
      toast.info(`Phone: ${proctor.phone}`);
    }
  };

  const handleInitiateCall = () => {
    toast.info(`Opening dialer for ${proctor.name}`, {
      description: `Calling ${proctor.phone} (${proctor.cabin})`
    });
    window.location.href = `tel:${proctor.phone.replace(/\s+/g, '')}`;
  };

  const loadSlots = async (date: string) => {
    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/proctor/slots?date=${date}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.slots)) {
        setSlots(json.slots);
        // If currently selected slot is blocked, auto-switch to first available slot
        const currentSlotObj = json.slots.find((s: SlotItem) => s.slot === selectedSlot);
        if (currentSlotObj?.isBlocked) {
          const firstOpen = json.slots.find((s: SlotItem) => !s.isBlocked);
          if (firstOpen) {
            setSelectedSlot(firstOpen.slot);
          }
        }
      }
    } catch {
      // Ignore
    } finally {
      setSlotsLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const res = await fetch("/api/proctor");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRequests(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots(selectedDate);
    loadRequests();
    const interval = setInterval(() => {
      loadSlots(selectedDate);
      loadRequests();
    }, 4000);

    const unsubscribe = universalWorkflow.subscribe((event) => {
      if (event.type === "PROCTOR_REQUEST_DECIDED") {
        toast.info("Proctor Advisory Schedule Confirmed", {
          description: event.notes || `Your proctor consultation has been confirmed for ${event.scheduledTime || 'the selected date'}.`
        });
        loadSlots(selectedDate);
        loadRequests();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [selectedDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    loadSlots(newDate);
  };

  const handleBookConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || message.trim().length < 5) {
      toast.error("Please enter a descriptive message (minimum 5 characters).");
      return;
    }

    if (!selectedSlot) {
      toast.error("Please select an available time slot.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/proctor/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: "Rahul Deshmukh",
          rollNumber: "21CS042",
          className: "B.Tech CSE - 4A",
          proctorName: proctor.name,
          topic,
          message: message.trim(),
          preferredDate: selectedDate,
          preferredTime: selectedSlot,
          contactPhone
        })
      });

      const json = await res.json();
      if (json.success) {
        universalWorkflow.emitEvent({
          type: "PROCTOR_REQUEST_SUBMITTED",
          payload: json.data
        });
        toast.success("Consultation Reserved Successfully!", {
          description: `Reserved for ${formatDateDDMMYYYY(selectedDate)} at ${selectedSlot}.`
        });
        setMessage("");
        await loadSlots(selectedDate);
        await loadRequests();
      } else {
        toast.error(json.message || "Failed to book slot.");
        await loadSlots(selectedDate);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openSlotsCount = slots.filter(s => !s.isBlocked).length;

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full bg-slate-50">
        <Header title="Faculty Proctor Advisory Hub" showBack />

        <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          {/* Proctor Profile Header Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-md">
                PK
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Assigned Faculty Mentor
                  </span>
                  <span className="text-xs font-semibold text-slate-400">Ward: Rahul Deshmukh (21CS042)</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{proctor.name}</h1>
                <p className="text-xs text-slate-500 font-medium">{proctor.designation} &bull; {proctor.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCallModalOpen(true)}
                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Cabin</span>
              </Button>
              <a
                href={`mailto:${proctor.email}?subject=Proctor Advisory Query - Rahul Deshmukh (21CS042)`}
                onClick={() => toast.info(`Opening email client to contact ${proctor.email}`)}
                className="h-10 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Consultation Request Form (7 cols) */}
            <div className="md:col-span-7 space-y-6">
              <Card className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="space-y-1 pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>Book Proctor Advisory Consultation</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Select a date & open time slot without collision to consult on attendance shortage or CIA marks.
                  </p>
                </div>

                <form onSubmit={handleBookConsultation} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Advisory Topic</label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      <option>Academic Attendance &amp; CIA Feedback</option>
                      <option>Medical Exemption / Leave Justification</option>
                      <option>Examination Hall Ticket Clearance</option>
                      <option>Career Guidance &amp; Placement Standing</option>
                      <option>Urgent Parent-Teacher Callback Request</option>
                    </select>
                  </div>

                  {/* Date & Time Slot Grid */}
                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Select Date</span>
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        min={new Date().toISOString().split("T")[0]}
                        className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Available Proctor Slots</span>
                        </span>
                        <span className="font-semibold text-slate-500">
                          {slotsLoading ? "Checking slots..." : `${openSlotsCount} of ${slots.length} Slots Open`}
                        </span>
                      </div>

                      {/* Interactive Slot Pills */}
                      <div className="grid grid-cols-2 gap-2">
                        {slots.map((s) => {
                          const isSelected = selectedSlot === s.slot && !s.isBlocked;
                          return (
                            <button
                              key={s.slot}
                              type="button"
                              disabled={s.isBlocked}
                              onClick={() => setSelectedSlot(s.slot)}
                              className={cn(
                                "p-2.5 rounded-xl border text-left text-xs transition-all relative flex flex-col justify-between min-h-[58px]",
                                s.isBlocked
                                  ? "bg-slate-100/90 border-slate-200 text-slate-400 cursor-not-allowed opacity-75"
                                  : isSelected
                                  ? "bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-600/30"
                                  : "bg-white border-slate-200 hover:border-blue-300 text-slate-800 hover:bg-blue-50/50"
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
                                  <span className="w-4 h-4 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold">
                                    <Check className="w-2.5 h-2.5" />
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-semibold border border-emerald-200">
                                    Open
                                  </span>
                                )}
                              </div>
                              <span className={cn("text-[10px]", isSelected ? "text-blue-100" : s.isBlocked ? "text-slate-400" : "text-slate-500")}>
                                {s.isBlocked ? (s.bookedByStudent ? `Reserved (${s.bookedByStudent.slice(0, 14)}...)` : "Slot Reserved") : "Zero Collision"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Callback Contact Phone</label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Consultation Agenda / Notes</label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      placeholder="Specify questions regarding attendance condonation, subject difficulty, or lab exam clearance..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Minimum 5 characters required</span>
                      <span>{message.length} chars</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting || openSlotsCount === 0}
                    className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? "Reserving Slot..." : `Confirm Booking for ${selectedSlot.split(" – ")[0]}`}</span>
                  </Button>
                </form>
              </Card>

              {/* Consultation History */}
              <Card className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Your Consultation &amp; Advisory Logs
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {requests.length} Total Records
                  </span>
                </div>

                {loading ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading advisory records...</div>
                ) : requests.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No consultation records logged yet.</div>
                ) : (
                  <div className="space-y-3">
                    {requests.map((item) => {
                      const isPending = item.status === "PENDING";
                      const isScheduled = item.status === "SCHEDULED";
                      const isCompleted = item.status === "COMPLETED";

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "p-4 rounded-xl border text-xs space-y-2 transition-all",
                            isPending
                              ? "bg-amber-50/60 border-amber-200"
                              : isScheduled
                              ? "bg-blue-50/60 border-blue-200"
                              : isCompleted
                              ? "bg-emerald-50/60 border-emerald-200"
                              : "bg-slate-50 border-slate-200"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">{item.topic}</span>
                              <span className="font-mono text-[10px] text-slate-400 font-semibold">
                                #{item.displayCode || `PR-${item.id.slice(0, 4).toUpperCase()}`}
                              </span>
                            </div>

                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1",
                              isPending
                                ? "bg-amber-100 text-amber-800"
                                : isScheduled
                                ? "bg-blue-100 text-blue-800"
                                : isCompleted
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-700"
                            )}>
                              {isPending && <Clock className="w-3 h-3 animate-spin" />}
                              {isScheduled && <Calendar className="w-3 h-3" />}
                              {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                              <span>{item.status}</span>
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {item.message}
                          </p>

                          <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{item.scheduledDate ? formatDateDDMMYYYY(item.scheduledDate) : formatDateDDMMYYYY(item.createdAt)}</span>
                              {item.scheduledTime && <span className="font-semibold text-slate-700">• {item.scheduledTime}</span>}
                            </span>

                            {item.meetingNotes && (
                              <span className="text-slate-700 font-semibold italic">
                                Note: {item.meetingNotes}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Office & Timing Details (5 cols) */}
            <div className="md:col-span-5 space-y-6">
              <Card className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Cabin &amp; Office Hours</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" /> Location
                    </p>
                    <p className="text-slate-600">{proctor.cabin}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" /> Walk-in Hours
                    </p>
                    <p className="text-slate-600">{proctor.hours}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" /> Official Email
                    </p>
                    <a
                      href={`mailto:${proctor.email}?subject=Proctor Query - Rahul Deshmukh (21CS042)`}
                      className="text-blue-600 hover:underline font-mono text-[11px] block"
                    >
                      {proctor.email}
                    </a>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> Emergency Hotline
                      </p>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Active Intercom
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-slate-900 font-bold font-mono text-xs">{proctor.phone}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCallModalOpen(true)}
                        className="h-7 px-2.5 text-[11px] font-semibold rounded-lg text-blue-600 border-blue-200 hover:bg-blue-50 flex items-center gap-1"
                      >
                        <PhoneCall className="w-3 h-3" /> Call
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Proctor Advisory Guideline */}
              <Card className="p-6 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span>Proctor Mentorship Policy</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Each student is assigned a dedicated faculty advisor to monitor academic progression, provide attendance shortage interventions, and facilitate direct parent-faculty dialogue.
                </p>
              </Card>
            </div>
          </div>
        </div>

        {/* Proctor Call Dialog / Modal */}
        <Dialog open={callModalOpen} onOpenChange={setCallModalOpen}>
          <DialogContent className="sm:max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-5">
            <DialogHeader className="space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md mb-2">
                <PhoneCall className="w-6 h-6 animate-pulse" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Faculty Proctor Direct Line</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Official Hotline
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Direct phone and intercom channel for ward parent-faculty communication.
              </DialogDescription>
            </DialogHeader>

            {/* Advisor Profile Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{proctor.name}</h4>
                  <p className="text-[11px] text-slate-500">{proctor.designation}</p>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                  {proctor.extension}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-medium">Location</span>
                  <span className="font-semibold text-slate-700">{proctor.cabin}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Direct Line</span>
                  <span className="font-bold text-blue-600 font-mono text-xs">{proctor.phone}</span>
                </div>
              </div>
            </div>

            {/* Calling & Copy Actions */}
            <div className="space-y-2.5 pt-1">
              <Button
                onClick={handleInitiateCall}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Dial Cabin Now ({proctor.phone})</span>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyPhone}
                  className="h-10 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {copiedNumber ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                      <span className="text-emerald-600 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Number</span>
                    </>
                  )}
                </Button>

                <a
                  href={`mailto:${proctor.email}?subject=Proctor Query - Rahul Deshmukh (21CS042)`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Send Email</span>
                </a>
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Operating Timings:</strong> {proctor.hours}. Calls outside these hours will be forwarded to the academic department desk.
              </span>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
