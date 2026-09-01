"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Clock, Calendar, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { academicService } from "@/services/academic";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const DEFAULT_ANOMALIES = [
  {
    student_id: "st-1",
    student_name: "Aarav Sharma",
    roll_number: "21CS001",
    pattern_type: "Period 1 Irregularity",
    detail: "Recorded absent for Period 1 (09:00 AM) but marked present for Period 2 & 3.",
    incident_count: 3,
    last_detected: "2026-08-28"
  },
  {
    student_id: "st-5",
    student_name: "Rohan Varma",
    roll_number: "21CS005",
    pattern_type: "Post-Lunch Departure",
    detail: "Recorded present for morning sessions but absent for afternoon practicals.",
    incident_count: 2,
    last_detected: "2026-08-29"
  },
  {
    student_id: "st-8",
    student_name: "Neha Gupta",
    roll_number: "22CS019",
    pattern_type: "Consecutive Friday Lab Absence",
    detail: "Absent for 2 consecutive Friday laboratory blocks.",
    incident_count: 2,
    last_detected: "2026-08-22"
  }
];

export default function ProxyAuditPage() {
  const [loading, setLoading] = useState(false);
  const [anomalies, setAnomalies] = useState<any[]>(DEFAULT_ANOMALIES);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAnomalies(DEFAULT_ANOMALIES);
      return;
    }

    academicService.getAttendanceAnomalies()
        .then(data => {
            if (!data || data.length === 0) setAnomalies(DEFAULT_ANOMALIES);
            else setAnomalies(data);
            setLoading(false);
        })
        .catch(() => {
          setAnomalies(DEFAULT_ANOMALIES);
          setLoading(false);
        });
  }, []);

  return (
    <PageTransition>
      <div className="flex flex-col min-h-full space-y-6">
        <Header title="Attendance Verification & Pattern Audit" />
        
        <div className="space-y-6">
          {/* Institutional Advisory */}
          <Card className="bg-amber-50/70 border border-amber-200 p-5 rounded-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 border border-amber-200">
               <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-amber-900 text-sm font-bold">Attendance Pattern Verification Active</h3>
              <p className="text-amber-800 text-xs font-medium leading-relaxed">
                Automated auditing cross-references roll call records across consecutive lectures to identify split-session attendance anomalies.
              </p>
            </div>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Flagged Audit Records ({anomalies.length})
              </h3>
              <span className="text-xs text-slate-400 font-medium">Department of Engineering</span>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {anomalies.map((item, idx) => (
                  <motion.div
                    key={`${item.student_id}-${item.pattern_type}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Card className="p-4 border-slate-200 shadow-sm rounded-xl bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs border border-slate-200">
                          {item.student_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{item.student_name}</h4>
                          <p className="text-xs text-slate-500 font-medium">{item.roll_number}</p>
                        </div>
                      </div>

                      <div className="flex-1 md:px-6">
                        <span className="inline-block text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mb-1">
                          {item.pattern_type}
                        </span>
                        <p className="text-xs text-slate-600 font-medium">{item.detail}</p>
                      </div>

                      <div className="text-left md:text-right shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 text-xs">
                        <p className="font-semibold text-slate-700">{item.incident_count} Incidents Recorded</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Last: {item.last_detected}</p>
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
