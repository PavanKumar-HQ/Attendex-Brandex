"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, ShieldCheck, ShieldAlert, Sparkles, Plus, Minus, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AttendanceCalculatorProps {
  currentPresent?: number;
  currentTotal?: number;
}

export function AttendanceCalculator({ currentPresent = 42, currentTotal = 46 }: AttendanceCalculatorProps) {
  const [classesToSkip, setClassesToSkip] = useState(0);
  const [classesToAttend, setClassesToAttend] = useState(0);

  // Projected attendance calculation
  const totalClasses = currentTotal + classesToSkip + classesToAttend;
  const totalPresent = currentPresent + classesToAttend;
  const projectedPct = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;

  // Calculate safe margin for 75%
  // 75% = (currentPresent / (currentTotal + x)) => x = (currentPresent / 0.75) - currentTotal
  const maxSafeSkips = Math.max(0, Math.floor((currentPresent / 0.75) - currentTotal));
  
  // Calculate required attendance to hit 75% if below
  // (currentPresent + y) / (currentTotal + y) = 0.75 => y = (0.75 * currentTotal - currentPresent) / 0.25
  const requiredToHit75 = projectedPct < 75 
    ? Math.max(0, Math.ceil((0.75 * (currentTotal + classesToSkip) - currentPresent) / 0.25))
    : 0;

  const isSafe = projectedPct >= 75;

  return (
    <Card className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Attendance Margin & Buffer Simulator</h3>
            <p className="text-xs text-slate-500 font-medium">Predict your eligibility before skipping or planning catch-up sessions</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setClassesToSkip(0); setClassesToAttend(0); }}
          className="h-8 px-3 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 self-start sm:self-auto gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </Button>
      </div>

      {/* Simulator Display Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-5 p-5 rounded-xl bg-slate-900 text-white space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projected Attendance</span>
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
              isSafe ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
            )}>
              {isSafe ? "Exam Safe" : "At Risk (<75%)"}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-bold tracking-tight">{projectedPct.toFixed(1)}%</h2>
            <span className="text-xs text-slate-400 font-medium">({totalPresent}/{totalClasses} sessions)</span>
          </div>

          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, projectedPct)}%` }}
              className={cn("h-full rounded-full transition-all", isSafe ? "bg-blue-500" : "bg-rose-500")}
            />
          </div>

          <div className="pt-2 text-xs text-slate-300 border-t border-slate-800 space-y-1">
            {isSafe ? (
              <p className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                You can safely miss up to <strong>{maxSafeSkips}</strong> more lectures.
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-rose-400 font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                Must attend <strong>{requiredToHit75}</strong> consecutive classes to restore 75%.
              </p>
            )}
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="md:col-span-7 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Planned Skips / Absences</label>
              <span className="text-xs font-bold text-rose-600">+{classesToSkip} Classes Skipped</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={classesToSkip <= 0}
                onClick={() => setClassesToSkip(prev => Math.max(0, prev - 1))}
                className="h-9 w-9 p-0 rounded-lg border-slate-200"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <input
                type="range"
                min="0"
                max="15"
                value={classesToSkip}
                onChange={(e) => setClassesToSkip(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-100 rounded-lg accent-rose-600 cursor-pointer"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClassesToSkip(prev => prev + 1)}
                className="h-9 w-9 p-0 rounded-lg border-slate-200"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Upcoming Lectures to Attend</label>
              <span className="text-xs font-bold text-blue-600">+{classesToAttend} Classes Attended</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={classesToAttend <= 0}
                onClick={() => setClassesToAttend(prev => Math.max(0, prev - 1))}
                className="h-9 w-9 p-0 rounded-lg border-slate-200"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <input
                type="range"
                min="0"
                max="20"
                value={classesToAttend}
                onChange={(e) => setClassesToAttend(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-100 rounded-lg accent-blue-600 cursor-pointer"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClassesToAttend(prev => prev + 1)}
                className="h-9 w-9 p-0 rounded-lg border-slate-200"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
