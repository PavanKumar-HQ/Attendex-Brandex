"use client";

import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, FileCode, AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AssignmentTracker() {
  const assignments = [
    {
      id: "asg-1",
      title: "Distributed Consensus Algorithm (Raft Implementation)",
      subject: "Distributed Systems (CS801)",
      deadline: "Oct 05, 2026",
      status: "Submitted",
      score: "9.5 / 10",
      color: "emerald"
    },
    {
      id: "asg-2",
      title: "Transformer Attention Head Visualization Lab",
      subject: "Deep Learning & NLP (AI602)",
      deadline: "Oct 12, 2026",
      status: "In Progress",
      score: "Pending Review",
      color: "blue"
    },
    {
      id: "asg-3",
      title: "Transaction ACID Recovery Simulation",
      subject: "Database Systems (IT401)",
      deadline: "Oct 16, 2026",
      status: "Assigned",
      score: "Due in 15 days",
      color: "amber"
    },
    {
      id: "asg-4",
      title: "FPGA 8-bit Arithmetic Logic Unit Layout",
      subject: "VLSI Design (EC801)",
      deadline: "Sep 28, 2026",
      status: "Graded",
      score: "10 / 10",
      color: "emerald"
    }
  ];

  return (
    <Card className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Continuous Evaluation &amp; Lab Submissions</h3>
          <p className="text-xs text-slate-500 font-medium">Verified CIA laboratory exercises and semester coursework</p>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-md">
          3/4 Completed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assignments.map((asg) => (
          <div
            key={asg.id}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition-all space-y-3 shadow-sm group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{asg.subject}</span>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {asg.title}
                </h4>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0",
                asg.status === "Submitted" || asg.status === "Graded" 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                  : asg.status === "In Progress"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              )}>
                {asg.status}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[11px]">Due: {asg.deadline}</span>
              </div>
              <span className="font-bold text-slate-900 text-xs">{asg.score}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
