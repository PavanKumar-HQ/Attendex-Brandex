"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calculator, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  Clock, 
  Calendar,
  CheckCircle2
} from "lucide-react";
import { AttendanceCalculator } from "@/components/student/attendance-calculator";

export default function StudentCalculatorPage() {
  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full bg-slate-50">
        <Header title="Attendance Margin &amp; Buffer Calculator" showBack />

        <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          {/* Overview Banner */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> University 75% Rule Engine
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Attendance Safe Margin &amp; Skip Simulator
            </h1>
            <p className="text-xs text-slate-500 font-medium max-w-2xl">
              Calculate precisely how many lectures you can safely afford to miss without losing exam eligibility, or how many makeup classes you need to restore your standing.
            </p>
          </div>

          {/* Calculator Component */}
          <AttendanceCalculator currentPresent={110} currentTotal={120} />

          {/* Academic Policy Advice */}
          <Card className="p-6 rounded-2xl bg-slate-900 text-white shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              Institutional Attendance Guidelines (KLE Tech Ordinance)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                <span className="font-bold text-emerald-400">&ge; 75% Attendance</span>
                <p>Full eligibility for End-Semester Examinations with 5/5 Continuous Internal Assessment marks.</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                <span className="font-bold text-amber-400">65% to 74% (Medical Condonation)</span>
                <p>Permitted only with registered Medical Leave certificate or official On-Duty university representation.</p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                <span className="font-bold text-rose-400">&lt; 65% (Detained)</span>
                <p>Candidate is not permitted to write examinations and must repeat course during summer term.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
