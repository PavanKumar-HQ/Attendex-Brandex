"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, AlertTriangle, CheckCircle2, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentListProps {
  students: any[];
  absentIds: Set<string>;
  onDutyIds: Set<string>;
  medicalIds: Set<string>;
  onToggle: (id: string, type: 'present' | 'absent' | 'od') => void;
  onMedical: (id: string) => void;
  loading?: boolean;
}

export function StudentList({ 
  students, 
  absentIds, 
  onDutyIds, 
  medicalIds, 
  onToggle, 
  onMedical,
  loading 
}: StudentListProps) {
  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Syncing Student Roster...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="py-20 text-center space-y-2">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
          <Search className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-slate-800">No matching student found</p>
        <p className="text-xs text-slate-500 font-medium">Verify your search term or selected academic filters</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100/90 relative">
      <AnimatePresence mode="popLayout">
        {students.map((student, i) => {
          const isAbsent = absentIds.has(student.id);
          const isOD = onDutyIds.has(student.id);
          const isMedical = medicalIds.has(student.id);
          const isPresent = !isAbsent && !isOD && !isMedical;

          const attendancePct = student.attendance ?? 88;
          const isAtRisk = attendancePct < 75;

          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ delay: i * 0.015, duration: 0.2 }}
              key={student.id}
              className={cn(
                "group px-4 md:px-6 py-3.5 flex items-center justify-between transition-all duration-150",
                isAbsent ? "bg-rose-50/50 hover:bg-rose-50/70" :
                isOD ? "bg-blue-50/50 hover:bg-blue-50/70" :
                isMedical ? "bg-amber-50/50 hover:bg-amber-50/70" :
                "hover:bg-slate-50/70"
              )}
            >
              {/* Student Identity Left */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all border shadow-xs",
                  isAbsent ? "bg-rose-100 text-rose-700 border-rose-200" :
                  isOD ? "bg-blue-100 text-blue-700 border-blue-200" :
                  isMedical ? "bg-amber-100 text-amber-700 border-amber-200" :
                  "bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-white group-hover:border-slate-300"
                )}>
                  {student.avatar || student.name?.charAt(0) || "S"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "font-bold text-sm leading-tight transition-colors truncate",
                      isAbsent ? "text-rose-950" :
                      isOD ? "text-blue-950" : "text-slate-900"
                    )}>
                      {student.name}
                    </span>

                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded">
                      {student.roll_number || student.rollNumber || "21CS001"}
                    </span>

                    {isAtRisk && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>Defaulter</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 mt-1">
                    <span className={cn(
                      "font-bold",
                      isAtRisk ? "text-rose-600" : "text-emerald-600"
                    )}>
                      {attendancePct}% Standing
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>{isAtRisk ? "Shortage: Requires +2 Lectures" : "Safe Zone: +3 Skips Allowed"}</span>
                  </div>
                </div>
              </div>

              {/* 4-State Tactile Switcher Right */}
              <div className="shrink-0">
                <div className="inline-flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-inner gap-1">
                  <button
                    type="button"
                    onClick={() => onToggle(student.id, 'present')}
                    className={cn(
                      "h-8 px-3 rounded-lg text-xs font-extrabold transition-all duration-150 flex items-center justify-center gap-1",
                      isPresent
                        ? "bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/20 scale-100"
                        : "text-slate-500 hover:text-slate-900 hover:bg-white/80"
                    )}
                  >
                    <span>P</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggle(student.id, 'absent')}
                    className={cn(
                      "h-8 px-3 rounded-lg text-xs font-extrabold transition-all duration-150 flex items-center justify-center gap-1",
                      isAbsent
                        ? "bg-rose-600 text-white shadow-sm ring-1 ring-rose-500/20 scale-100"
                        : "text-slate-500 hover:text-rose-600 hover:bg-white/80"
                    )}
                  >
                    <span>A</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggle(student.id, 'od')}
                    className={cn(
                      "h-8 px-2.5 rounded-lg text-xs font-extrabold transition-all duration-150 flex items-center justify-center gap-1",
                      isOD
                        ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-500/20 scale-100"
                        : "text-slate-500 hover:text-blue-600 hover:bg-white/80"
                    )}
                  >
                    <span>OD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onMedical(student.id)}
                    className={cn(
                      "h-8 px-2.5 rounded-lg text-xs font-extrabold transition-all duration-150 flex items-center justify-center gap-1",
                      isMedical
                        ? "bg-amber-500 text-white shadow-sm ring-1 ring-amber-500/20 scale-100"
                        : "text-slate-500 hover:text-amber-600 hover:bg-white/80"
                    )}
                  >
                    <span>ML</span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
