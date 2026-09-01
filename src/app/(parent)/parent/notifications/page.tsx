"use client";

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
    CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LeaveRequestModal } from "@/components/parent/leave-request-modal";
import { FeeLedgerModal } from "@/components/parent/fee-ledger-modal";

const notifications = [
    {
        id: 1,
        type: "Attendance Shortage",
        title: "Attendance Warning Notice",
        desc: "Rahul's attendance in Distributed Systems has dropped to 72.4%. Minimum 75% required for exam hall ticket clearance.",
        time: "2 hours ago",
        icon: AlertCircle,
        color: "bg-rose-50 border-rose-200 text-rose-600",
        isNew: true,
        action: "leave"
    },
    {
        id: 2,
        type: "Finance & Accounts",
        title: "Semester Fee Clearance Receipt",
        desc: "End-Semester examination registration fee of ₹2,400 has been verified. Official receipt generated.",
        time: "1 day ago",
        icon: Receipt,
        color: "bg-emerald-50 border-emerald-200 text-emerald-600",
        isNew: false,
        action: "fee"
    },
    {
        id: 3,
        type: "Advisor Consultation",
        title: "Parent-Faculty Advisory Session (PTM)",
        desc: "Quarterly proctor consultation scheduled for Saturday at 10:30 AM in Computer Science Block.",
        time: "3 days ago",
        icon: Calendar,
        color: "bg-blue-50 border-blue-200 text-blue-600",
        isNew: false,
        action: null
    },
    {
        id: 4,
        type: "System Verification",
        title: "Institutional Registration Verified",
        desc: "University registration & CIA assessment records for Rahul Deshmukh have been validated by Registrar Office.",
        time: "1 week ago",
        icon: ShieldCheck,
        color: "bg-slate-50 border-slate-200 text-slate-700",
        isNew: false,
        action: null
    },
];

export default function ParentNotificationsPage() {
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
                      onClick={() => toast.success("All alerts marked as acknowledged")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 rounded-lg"
                    >
                        Mark all as read
                    </Button>
                </header>

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
                                    <div className={cn(
                                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border",
                                        note.color
                                    )}>
                                        <note.icon className="w-5 h-5" />
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

