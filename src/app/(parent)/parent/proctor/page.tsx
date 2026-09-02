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
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { formatDateDDMMYYYY, cn } from "@/lib/utils";

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
  const [topic, setTopic] = useState("Academic Attendance & CIA Feedback");
  const [message, setMessage] = useState("");
  const [preferredTime, setPreferredTime] = useState("Afternoon (3:30 PM – 5:00 PM)");
  const [contactPhone, setContactPhone] = useState("+91 98450 12345");
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<ProctorRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const proctor = {
    name: "Dr. Pavan Kulkarni",
    designation: "Professor & Designated Proctor Advisor",
    department: "Department of Computer Science & Engineering",
    email: "pavan.kulkarni@attendex.edu",
    phone: "+91 98450 12345",
    cabin: "CS Block, Room 304 (3rd Floor)",
    hours: "Monday to Friday (3:30 PM – 5:00 PM)"
  };

  const loadRequests = async () => {
    try {
      const res = await fetch("/api/proctor");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRequests(json.data);
      }
    } catch {
      // Ignore network errors on polling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleBookConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || message.trim().length < 5) {
      toast.error("Please enter a descriptive message (minimum 5 characters).");
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
          preferredTime,
          contactPhone
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Consultation Request Registered!", {
          description: `${proctor.name} notified. Callback / slot confirmation will be dispatched shortly.`
        });
        setMessage("");
        await loadRequests();
      } else {
        toast.error(json.message || "Failed to submit request.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
              <a
                href={`tel:${proctor.phone.replace(/\s+/g, '')}`}
                onClick={() => toast.info(`Initiating direct call to ${proctor.name}'s cabin: ${proctor.phone}`)}
                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Cabin</span>
              </a>
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
                    <span>Request Proctor Consultation / Callback</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Submit a query regarding your ward's academic standing, attendance shortage, or exam clearance.
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

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Preferred Time Slot</label>
                      <select
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option>Afternoon (3:30 PM – 5:00 PM)</option>
                        <option>Morning (10:00 AM – 11:30 AM)</option>
                        <option>Weekend Online Consultation</option>
                        <option>Urgent / Immediate Callback</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Callback Phone Number</label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Detailed Message / Inquiry</label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      placeholder="Please mention specific concerns or questions you would like to discuss..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Minimum 5 characters required</span>
                      <span>{message.length} chars</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? "Transmitting to Proctor..." : "Submit Consultation Request"}</span>
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
                              {item.scheduledTime && <span>• {item.scheduledTime}</span>}
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
                    <p className="text-slate-600 font-mono text-[11px]">{proctor.email}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" /> Emergency Hotline
                    </p>
                    <p className="text-slate-600 font-mono text-[11px]">{proctor.phone}</p>
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
      </div>
    </PageTransition>
  );
}
