"use client";

import { useState, useEffect } from "react";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import {
    Bell,
    MessageSquare,
    AlertCircle,
    Calendar,
    Receipt,
    ChevronRight,
    ShieldCheck,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LeaveRequestModal } from "@/components/parent/leave-request-modal";
import { FeeLedgerModal } from "@/components/parent/fee-ledger-modal";
import { supabase } from "@/lib/supabase";

interface NotificationItem {
  id: string | number;
  type: string;
  title: string;
  desc: string;
  time: string;
  isNew: boolean;
  action?: "leave" | "fee" | null;
}

export default function ParentNotificationsPage() {
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        let query = supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (user) {
          query = query.or(`user_id.eq.${user.id},role.eq.PARENT`);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const mapped: NotificationItem[] = data.map((n: any) => ({
            id: n.id,
            type: n.category || "Institutional Notice",
            title: n.title,
            desc: n.message,
            time: n.created_at ? new Date(n.created_at).toLocaleDateString() : "Recent",
            isNew: !n.is_read,
            action: n.action_type === 'leave' ? 'leave' : n.action_type === 'fee' ? 'fee' : null
          }));
          setNotifications(mapped);
        } else {
          setNotifications([]);
        }
      } catch (err) {
        console.error("Error loading parent notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchNotifications();
    }, []);

    const markAllAsRead = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id);
        }
        setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
        toast.success("All alerts marked as acknowledged");
      } catch {
        toast.error("Failed to update notifications");
      }
    };

    return (
        <PageTransition>
            <div className="flex flex-col min-h-full pb-20 pt-8 max-w-4xl mx-auto space-y-8 px-4 md:px-0">

                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Family Notifications &amp; Alerts</h1>
                            <p className="text-slate-500 font-medium text-xs mt-0.5">Official communication from Attendex Academic Office</p>
                        </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={markAllAsRead}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 rounded-lg"
                    >
                        Mark all as read
                    </Button>
                </header>

                {loading ? (
                  <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                    <span className="text-xs font-medium">Loading notifications from database...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <Card className="p-12 text-center border-dashed border-slate-300 bg-white rounded-2xl space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800">No Notifications</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      There are no institutional alerts or circulars for your ward at this time.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((note, i) => (
                        <motion.div
                            key={note.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className={cn(
                                "p-5 border-slate-200 rounded-xl bg-white transition-all hover:border-blue-200 group relative border shadow-sm",
                                note.isNew ? "bg-blue-50/20 ring-1 ring-blue-500/20" : ""
                            )}>
                                <div className="flex items-start gap-4">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border bg-blue-50 border-blue-200 text-blue-600">
                                        <Bell className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 space-y-1.5 pr-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{note.type}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                            <span className="text-[11px] font-medium text-slate-400">{note.time}</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900">{note.title}</h4>
                                        <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl">
                                            {note.desc}
                                        </p>

                                        {note.action === "leave" && (
                                          <div className="pt-2">
                                            <LeaveRequestModal 
                                              triggerButton={
                                                <Button size="sm" className="h-8 px-3 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800">
                                                  Submit Exemption Application
                                                </Button>
                                              }
                                            />
                                          </div>
                                        )}

                                        {note.action === "fee" && (
                                          <div className="pt-2">
                                            <FeeLedgerModal 
                                              triggerButton={
                                                <Button size="sm" variant="outline" className="h-8 px-3 rounded-lg border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50">
                                                  View Official Receipt
                                                </Button>
                                              }
                                            />
                                          </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                  </div>
                )}

                {/* Messaging Bottom CTA */}
                <div className="p-8 rounded-2xl bg-slate-900 text-white relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                        <div className="space-y-2 max-w-md">
                            <div className="inline-flex p-2.5 bg-white/10 rounded-xl">
                                <MessageSquare className="w-5 h-5 text-blue-400" />
                            </div>
                            <h3 className="text-lg font-bold tracking-tight">Direct Faculty Proctor Advisor</h3>
                            <p className="text-slate-400 font-medium text-xs">Have questions regarding attendance shortage or marks? Request a proctor consultation.</p>
                        </div>
                        <Button 
                          onClick={() => toast.success("Advisory Consultation Requested", { description: "Class Advisor Dr. Pavan Kulkarni will contact you within 24 hours." })}
                          className="whitespace-nowrap h-11 px-6 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-sm hover:bg-blue-500 transition-all shrink-0"
                        >
                            Request Advisor Callback
                        </Button>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}


