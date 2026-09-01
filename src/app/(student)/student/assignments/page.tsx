"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckSquare, 
  Clock, 
  FileCode, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  BookOpen, 
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ASSIGNMENTS_DATA = [
  {
    id: "asg-1",
    title: "Distributed Consensus Algorithm (Raft Implementation)",
    subject: "Distributed Systems & Cloud (CS801)",
    instructor: "Prof. R. Sharma",
    deadline: "Oct 05, 2026",
    status: "Submitted",
    score: "9.5 / 10",
    maxMarks: 10,
    type: "Lab Exercise",
    description: "Implement leader election and log replication module using Python/Go with test suite verification."
  },
  {
    id: "asg-2",
    title: "Transformer Attention Head Visualization Lab",
    subject: "Deep Learning & Neural Nets (AI602)",
    instructor: "Dr. K. Nair",
    deadline: "Oct 12, 2026",
    status: "In Progress",
    score: "Pending Submission",
    maxMarks: 15,
    type: "Practical Lab",
    description: "Visualize Multi-Head Self-Attention layers on BERT embeddings for sentiment classification."
  },
  {
    id: "asg-3",
    title: "Transaction ACID Recovery & Write-Ahead Log",
    subject: "Database Architecture (IT401)",
    instructor: "Dr. P. Patel",
    deadline: "Oct 16, 2026",
    status: "Assigned",
    score: "Due in 15 days",
    maxMarks: 10,
    type: "Theory Assignment",
    description: "Formulate ARIES recovery protocol trace under system crash conditions."
  },
  {
    id: "asg-4",
    title: "FPGA 8-bit Arithmetic Logic Unit Layout",
    subject: "VLSI Design & Architecture (EC801)",
    instructor: "Dr. S. Kulkarni",
    deadline: "Sep 28, 2026",
    status: "Graded",
    score: "10 / 10",
    maxMarks: 10,
    type: "Lab Manual",
    description: "Complete layout design, timing verification, and FPGA bitstream synthesis."
  }
];

export default function StudentAssignmentsPage() {
  const [filter, setFilter] = useState<"all" | "In Progress" | "Submitted" | "Graded">("all");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const filteredAssignments = ASSIGNMENTS_DATA.filter(a => filter === "all" || a.status === filter);

  const handleUploadSubmission = (asg: typeof ASSIGNMENTS_DATA[0]) => {
    setSubmittingId(asg.id);
    toast.loading(`Uploading submission for ${asg.title}...`);
    setTimeout(() => {
      setSubmittingId(null);
      toast.dismiss();
      toast.success("Submission Uploaded Successfully", {
        description: `Your lab report has been queued for faculty review by ${asg.instructor}.`
      });
    }, 1200);
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full bg-slate-50">
        <Header title="Assignments &amp; Practical Labs" showBack />

        <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          {/* Header Overview Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                  Semester Continuous Evaluation
                </span>
                <span className="text-xs font-semibold text-slate-400">Autumn 2026</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Coursework &amp; Lab Submissions</h1>
              <p className="text-xs text-slate-500 font-medium">
                Submit laboratory manuals, code assignments, and review grades given by faculty instructors.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</p>
                <p className="text-lg font-bold text-emerald-600">3 / 4 Done</p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 w-fit overflow-x-auto">
            {(["all", "In Progress", "Submitted", "Graded"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "h-8 px-3.5 rounded-lg text-xs font-semibold transition-all capitalize whitespace-nowrap",
                  filter === f
                    ? "bg-slate-900 text-white shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                {f === "all" ? "All Coursework" : f}
              </button>
            ))}
          </div>

          {/* Assignments List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredAssignments.map((asg) => (
                <motion.div
                  key={asg.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <Card className="p-5 md:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-200 transition-all flex flex-col justify-between space-y-4 h-full">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {asg.subject}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">
                            {asg.title}
                          </h3>
                        </div>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide shrink-0 border",
                          asg.status === "Graded" || asg.status === "Submitted"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : asg.status === "In Progress"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {asg.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {asg.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Due: {asg.deadline}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">
                          {asg.score}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.info("Downloading Assignment Brief", { description: "Opening PDF question rubric." })}
                          className="h-8 flex-1 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Brief PDF</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUploadSubmission(asg)}
                          disabled={submittingId === asg.id}
                          className="h-8 flex-1 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 flex items-center justify-center gap-1 shadow-sm"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{asg.status === "Graded" ? "Re-upload" : "Submit Work"}</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
