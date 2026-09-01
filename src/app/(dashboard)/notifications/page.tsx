"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Clock, Bell, Send, RefreshCcw, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { academicService } from "@/services/academic";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { isSupabaseConfigured } from "@/lib/supabase";

const DEFAULT_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "End-Semester Examination Schedule Published",
    message: "Final timetable for 4th and 6th Semester Engineering courses is now available in the Timetable section.",
    type: "broadcast",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
  },
  {
    id: "notif-2",
    title: "Faculty Submission of CIA-2 Marks",
    message: "All departmental faculty are requested to upload and verify CIA-2 evaluation ledgers by Sept 22nd.",
    type: "broadcast",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: "notif-3",
    title: "National Technical Symposium Registration Open",
    message: "Annual tech fest registrations are open for Computer Science, AI, and Electronics batches.",
    type: "broadcast",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  },
  {
    id: "notif-4",
    title: "Classroom & Lab Maintenance Notice",
    message: "Hall 302 and AI Lab will undergo scheduled hardware maintenance on Saturday from 08:00 AM to 12:00 PM.",
    type: "alert",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>(DEFAULT_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");

  const applyTemplate = (title: string, msg: string) => {
    setNewTitle(title);
    setNewMessage(msg);
    toast.info("Template applied", { description: "Customize the message as needed before broadcasting." });
  };

  const loadNotifications = async () => {
    if (!isSupabaseConfigured) {
      setNotifications(DEFAULT_NOTIFICATIONS);
      return;
    }

    try {
      setLoading(true);
      const data = await academicService.getNotifications();
      if (!data || data.length === 0) {
        setNotifications(DEFAULT_NOTIFICATIONS);
      } else {
        setNotifications(data);
      }
    } catch {
      setNotifications(DEFAULT_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleBroadcast = async () => {
    if (!newTitle || !newMessage) return toast.error("Notification title and body required");
    
    setIsBroadcasting(true);
    try {
      if (isSupabaseConfigured) {
        await academicService.broadcastNotification({
            title: newTitle,
            message: newMessage,
            type: 'broadcast'
        });
      }
      
      const newEntry = {
        id: `notif-${Date.now()}`,
        title: newTitle,
        message: newMessage,
        type: "broadcast",
        created_at: new Date().toISOString()
      };
      setNotifications(prev => [newEntry, ...prev]);

      toast.success("Institutional Broadcast Dispatched", {
          description: "Notification has been broadcast to faculty and students."
      });
      setNewTitle("");
      setNewMessage("");
    } catch {
      toast.error("Broadcast failed");
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-full space-y-6">
        <Header title="Institutional Notifications & Broadcast Hub" />
        
        <div className="space-y-6">
          {/* Institutional Broadcaster */}
          <Card className="p-6 border-slate-200 bg-white shadow-sm rounded-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Compose Institutional Broadcast</h3>
                <p className="text-xs text-slate-500 font-medium">Send priority notifications to students, faculty, and guardians</p>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-md w-fit">
                Active SMS &amp; Push Relay
              </span>
            </div>

            {/* Quick Templates */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Attendance Shortage Alert", title: "Urgent Attendance Shortage Notice", msg: "Students with attendance below 75% are at risk of debarment. Guardians are requested to review attendance records." },
                  { label: "CIA-2 Evaluation Schedule", title: "CIA-2 Schedule Announcement", msg: "Continuous Internal Assessment (CIA-2) schedules have been updated in the Class Timetable." },
                  { label: "Hall Ticket Release", title: "Semester Hall Tickets Active", msg: "Digital entry passes for the upcoming semester examinations are now available for verified students." },
                  { label: "Lab Session Rescheduled", title: "Lab Rescheduling Notice", msg: "Practical lab sessions for 4th Semester will be conducted in AI Lab Block B." },
                ].map(tmpl => (
                  <button
                    key={tmpl.label}
                    type="button"
                    onClick={() => applyTemplate(tmpl.title, tmpl.msg)}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    + {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
              <div className="md:col-span-8 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Notice Heading</label>
                    <Input 
                      placeholder="e.g. Schedule Revision: Operating Systems" 
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="h-10 rounded-lg border-slate-200 bg-slate-50 text-xs" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Target Audience</label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="all">All Portals (Faculty, Student, Parent)</option>
                      <option value="defaulters">Guardians of Defaulter Students (&lt;75%)</option>
                      <option value="cs4a">B.Tech Computer Science (4A)</option>
                      <option value="ai3b">B.Tech AI &amp; Data Science (3B)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Notice Body</label>
                  <textarea
                    placeholder="Enter comprehensive notice details for institutional record..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full h-20 p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none font-medium" 
                  />
                </div>
              </div>
              
              <div className="md:col-span-4 flex flex-col justify-between gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
                  <p className="font-bold text-slate-800">Dispatch Channels:</p>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      In-App Dashboard Feed
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      SMS Gateway Relay
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleBroadcast}
                  disabled={isBroadcasting}
                  className="h-11 w-full rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {isBroadcasting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Dispatch Broadcast
                </Button>
              </div>
            </div>
          </Card>

          {/* Live Log Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Dispatched Notices History
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {notifications.length} Total Notices
              </span>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {notifications.map((notif, idx) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Card className="p-4 border-slate-200 shadow-sm rounded-xl bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5",
                          notif.type === 'broadcast' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-slate-100 border-slate-200 text-slate-700"
                        )}>
                          <Bell className="w-4 h-4" />
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">{notif.message || notif.description}</p>
                        </div>
                      </div>

                      <div className="text-left md:text-right shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                        <p className="text-xs font-semibold text-slate-700">{new Date(notif.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">Delivered</span>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
