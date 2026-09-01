"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Award, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Sparkles, 
  Medal,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";

export default function ParentConductPage() {
  const student = {
    name: "Rahul Deshmukh",
    rollNumber: "21CS042",
    conductGrade: "Exemplary (Grade A+)",
    punctualityRate: "98.2%",
    libraryRecord: "Clean (0 Overdue Books)",
    labCompliance: "100% Certified"
  };

  const commendations = [
    {
      date: "Sep 18, 2026",
      faculty: "Prof. R. Sharma (HOD CSE)",
      title: "Dean's Commendation for Technical Leadership",
      note: "Rahul mentored junior batch students during the Open Source Linux kernel workshop with exemplary discipline and patience."
    },
    {
      date: "Aug 25, 2026",
      faculty: "Dr. K. Nair (AI Lab Incharge)",
      title: "Laboratory Discipline & Equipment Care",
      note: "Maintained pristine GPU server workstations during deep learning practicum sessions with zero safety violations."
    }
  ];

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full bg-slate-50">
        <Header title="Student Conduct &amp; Merit Ledger" showBack />

        <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          {/* Header Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Dean's Honor Roll
                </span>
                <span className="text-xs font-semibold text-slate-400">Ward: {student.name} ({student.rollNumber})</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Behavioral Standing &amp; Merits Record</h1>
              <p className="text-xs text-slate-500 font-medium">
                Official disciplinary record, punctuality scores, library clearance, and faculty commendations.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-left sm:text-right shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discipline Standing</p>
              <p className="text-base font-bold text-emerald-600">{student.conductGrade}</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Punctuality Score</span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{student.punctualityRate}</p>
              <p className="text-[10px] text-slate-400 font-medium">0 Unexcused late arrivals</p>
            </Card>

            <Card className="p-5 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Library Record</span>
                <BookOpen className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">Cleared</p>
              <p className="text-[10px] text-slate-400 font-medium">No pending return dues</p>
            </Card>

            <Card className="p-5 rounded-xl bg-white border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Lab Protocol</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">100% Pass</p>
              <p className="text-[10px] text-slate-400 font-medium">All safety guidelines met</p>
            </Card>
          </div>

          {/* Faculty Commendation Feed */}
          <Card className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Faculty Commendations &amp; Merits
            </h3>

            <div className="space-y-3">
              {commendations.map((c, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600">{c.faculty}</span>
                      <h4 className="text-xs font-bold text-slate-900">{c.title}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{c.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{c.note}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
