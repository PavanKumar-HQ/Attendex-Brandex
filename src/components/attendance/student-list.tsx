"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
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
      <div className="py-24 flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-4">
          <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-500">Loading Student Records...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-3">
          <Search className="w-6 h-6" />
        </div>
        <p className="text-base font-bold text-slate-900">No match found</p>
        <p className="text-sm font-medium text-slate-500 mt-1">Try a different roll number or name</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 relative">
      <AnimatePresence mode="popLayout">
        {students.map((student, i) => {
          const isAbsent = absentIds.has(student.id);
          const isOD = onDutyIds.has(student.id);
          const isMedical = medicalIds.has(student.id);

          return (
            <motion.div
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: i * 0.02 }}
              key={student.id}
              className={cn(
                "group px-3 md:px-8 py-4 md:py-5 flex items-center justify-between transition-colors",
                isAbsent && "bg-red-50/40 hover:bg-red-50/60",
                isOD && "bg-blue-50/40 hover:bg-blue-50/60",
                isMedical && "bg-amber-50/40 hover:bg-amber-50/60",
                !isAbsent && !isOD && !isMedical && "hover:bg-slate-50/50"
              )}
            >
              <div className="flex items-center gap-2 md:gap-5 flex-1 min-w-0">
                <div className={cn(
                  "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all border shrink-0 shadow-sm",
                  isAbsent ? "bg-red-100 text-red-600 border-red-200" :
                    isOD ? "bg-blue-100 text-blue-600 border-blue-200" :
                    isMedical ? "bg-amber-100 text-amber-600 border-amber-200" :
                      "bg-slate-50 text-slate-600 border-slate-100 group-hover:bg-white"
                )}>
                  {student.avatar || student.name?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className={cn("font-bold text-sm md:text-base transition-colors flex items-center gap-2 md:gap-3 truncate",
                    isAbsent ? "text-red-900" :
                      isOD ? "text-blue-900" : "text-slate-900"
                  )}>
                    {student.name}
                    {student.attendance < 75 && (
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-200 shrink-0">
                        Risk
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-2 mt-1">
                    {student.roll_number || student.rollNumber}
                    <span className="text-slate-200">/</span>
                    <span className={cn(student.attendance < 75 ? "text-amber-600" : "text-slate-500")}>
                      {student.attendance}% Attendance
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-[150px] md:w-[180px] flex justify-center items-center shrink-0">
                <div className="flex items-center gap-1 md:gap-2 bg-slate-100/80 p-0.5 md:p-1.5 rounded-xl border border-slate-200 ml-1">
                  <button
                    onClick={() => onToggle(student.id, 'present')}
                    className={cn(
                      "w-8 h-8 md:w-10 md:h-10 rounded-lg text-[10px] md:text-xs font-bold transition-all flex items-center justify-center",
                      !isAbsent && !isOD && !isMedical ? "bg-white text-emerald-600 shadow-md ring-1 ring-emerald-500/10" : "text-slate-400 hover:text-slate-600 hover:bg-white"
                    )}
                  >P</button>
                  <button
                    onClick={() => onToggle(student.id, 'absent')}
                    className={cn(
                      "w-8 h-8 md:w-10 md:h-10 rounded-lg text-[10px] md:text-xs font-bold transition-all flex items-center justify-center",
                      isAbsent ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-slate-400 hover:text-slate-600 hover:bg-white"
                    )}
                  >A</button>
                  <button
                    onClick={() => onToggle(student.id, 'od')}
                    className={cn(
                      "w-8 h-8 md:w-10 md:h-10 rounded-lg text-[10px] md:text-xs font-bold transition-all flex items-center justify-center",
                      isOD ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-slate-600 hover:bg-white"
                    )}
                  >OD</button>
                  <button
                    onClick={() => onMedical(student.id)}
                    className={cn(
                      "w-8 h-8 md:w-10 md:h-10 rounded-lg text-[10px] md:text-xs font-bold transition-all flex items-center justify-center",
                      isMedical ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "text-slate-400 hover:text-slate-600 hover:bg-white"
                    )}
                  >ML</button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
