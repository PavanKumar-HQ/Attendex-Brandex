"use client";

import { useState } from "react";
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
  Send
} from "lucide-react";
import { toast } from "sonner";

export default function ParentProctorPage() {
  const [topic, setTopic] = useState("Academic Attendance & CIA Feedback");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const proctor = {
    name: "Dr. Pavan Kulkarni",
    designation: "Professor & Designated Proctor Advisor",
    department: "Department of Computer Science & Engineering",
    email: "pavan.kulkarni@attendex.edu",
    phone: "+91 98450 12345",
    cabin: "CS Block, Room 304 (3rd Floor)",
    hours: "Monday to Friday (3:30 PM – 5:00 PM)"
  };

  const advisoryHistory = [
    {
      date: "Sep 20, 2026",
      type: "Semester Review Meeting",
      notes: "Reviewed CIA-1 scores. Rahul is performing consistently in Distributed Systems (94%). Recommended focusing on Applied Physics lab coursework.",
      action: "Resolved"
    },
    {
      date: "Aug 12, 2026",
      type: "Proctor Onboarding & Standing",
      notes: "Confirmed student enrollment in final year electives and capstone project panel allocation.",
      action: "Completed"
    }
  ];

  const handleBookConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    toast.loading("Transmitting consultation request to Proctor...");

    setTimeout(() => {
      setSubmitting(false);
      setMessage("");
      toast.dismiss();
      toast.success("Consultation Request Registered", {
        description: `Dr. Pavan Kulkarni will contact you via email/phone within 24 hours.`
      });
    }, 1000);
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
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{proctor.name}</h1>
                <p className="text-xs text-slate-500 font-medium">{proctor.designation} &bull; {proctor.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${proctor.phone.replace(/\s+/g, '')}`}
                className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Cabin</span>
              </a>
              <a
                href={`mailto:${proctor.email}?subject=Proctor Advisory Query - Rahul Deshmukh (21CS042)`}
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
                  <h3 className="text-sm font-bold text-slate-900">Request Proctor Consultation / Callback</h3>
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
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Detailed Message / Inquiry</label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      placeholder="Please mention specific concerns or questions you would like to discuss..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? "Transmitting..." : "Submit Consultation Request"}</span>
                  </Button>
                </form>
              </Card>

              {/* Consultation History */}
              <Card className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Past Advisory Logs</h3>
                <div className="space-y-3">
                  {advisoryHistory.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{item.type}</span>
                        <span className="text-slate-400 font-medium">{item.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.notes}</p>
                    </div>
                  ))}
                </div>
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
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
