"use client";

import { useState, useEffect } from "react";
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
  Calendar,
  X,
  Send,
  Link2,
  FileCheck
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Assignment {
  id: string;
  title: string;
  subject: string;
  instructor: string;
  deadline: string;
  status: "Assigned" | "In Progress" | "Submitted" | "Graded";
  score: string;
  maxMarks: number;
  type: string;
  description: string;
  submissionLink?: string;
  submittedAt?: string;
}

const INITIAL_ASSIGNMENTS: Assignment[] = [
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
    description: "Implement leader election and log replication module using Python/Go with test suite verification.",
    submittedAt: "Oct 03, 2026 • 09:30 PM",
    submissionLink: "https://github.com/rahuldeshmukh/raft-consensus"
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
    score: "Due in 14 days",
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
    description: "Complete layout design, timing verification, and FPGA bitstream synthesis.",
    submittedAt: "Sep 27, 2026 • 04:15 PM"
  }
];

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [filter, setFilter] = useState<"all" | "In Progress" | "Submitted" | "Graded">("all");
  const [activeModalItem, setActiveModalItem] = useState<Assignment | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load from localStorage if present
  useEffect(() => {
    try {
      const stored = localStorage.getItem("attendex_student_assignments");
      if (stored) {
        setAssignments(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveAssignments = (items: Assignment[]) => {
    setAssignments(items);
    try {
      localStorage.setItem("attendex_student_assignments", JSON.stringify(items));
    } catch {
      // Ignore
    }
  };

  const filteredAssignments = assignments.filter(a => filter === "all" || a.status === filter);

  const openSubmitDialog = (asg: Assignment) => {
    setActiveModalItem(asg);
    setSubmissionUrl(asg.submissionLink || "");
    setSubmissionNotes("");
  };

  const handleConfirmSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalItem) return;

    setIsSubmitting(true);
    const now = new Date();
    const timestamp = `${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;

    const updated = assignments.map(a => {
      if (a.id === activeModalItem.id) {
        return {
          ...a,
          status: "Submitted" as const,
          score: "Pending Faculty Evaluation",
          submissionLink: submissionUrl || "https://drive.google.com/attendex/submissions/21CS042",
          submittedAt: timestamp
        };
      }
      return a;
    });

    saveAssignments(updated);
    setIsSubmitting(false);
    setActiveModalItem(null);

    toast.success("Assignment Submitted Successfully!", {
      description: `Dispatched to ${activeModalItem.instructor} for grading.`
    });
  };

  const completedCount = assignments.filter(a => a.status === "Submitted" || a.status === "Graded").length;

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
                  Continuous Assessment Portal
                </span>
                <span className="text-xs font-semibold text-slate-400">Semester 8 (2026-2027)</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Coursework &amp; Lab Submissions</h1>
              <p className="text-xs text-slate-500 font-medium">
                Submit laboratory manuals, code assignments, and track grades evaluated by your faculty instructors.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</p>
                <p className="text-lg font-bold text-slate-900">{completedCount} / {assignments.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {(["all", "In Progress", "Submitted", "Graded"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl font-semibold border transition-all shrink-0 capitalize",
                  filter === tab
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                {tab === "all" ? "All Assignments" : tab}
              </button>
            ))}
          </div>

          {/* Assignments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssignments.map(asg => {
              const isGraded = asg.status === "Graded";
              const isSubmitted = asg.status === "Submitted";
              const isInProgress = asg.status === "In Progress" || asg.status === "Assigned";

              return (
                <Card
                  key={asg.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {asg.type}
                      </span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1",
                        isGraded
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isSubmitted
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      )}>
                        {isGraded && <CheckCircle2 className="w-3 h-3" />}
                        {isSubmitted && <Clock className="w-3 h-3" />}
                        {isInProgress && <AlertCircle className="w-3 h-3" />}
                        <span>{asg.status}</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{asg.title}</h3>
                      <p className="text-xs font-semibold text-blue-600 mt-0.5">{asg.subject}</p>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {asg.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Instructor: {asg.instructor}</span>
                      <span className="font-semibold text-slate-700">Due: {asg.deadline}</span>
                    </div>

                    {asg.submittedAt && (
                      <p className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-100 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Submitted on {asg.submittedAt}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Score / Status</span>
                      <span className="text-xs font-bold text-slate-900">{asg.score}</span>
                    </div>

                    {isInProgress ? (
                      <Button
                        size="sm"
                        onClick={() => openSubmitDialog(asg)}
                        className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Submit Work</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast.info(`Viewing Submission for ${asg.title}`, { description: asg.submissionLink || "Attached report is verified." })}
                        className="h-8 px-3 rounded-lg border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>View Submission</span>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Submission Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span>Submit Assignment</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {activeModalItem.title}
                </p>
              </div>
              <button
                onClick={() => setActiveModalItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSubmission} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Repository / Google Drive Link *</label>
                <div className="relative">
                  <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    required
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                    placeholder="https://github.com/your-username/lab-assignment"
                    className="w-full h-9 pl-8 pr-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Submission Comments / Notes</label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Optional note for the instructor (e.g. Completed benchmark tests in Section 3)..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900">
                <p className="font-semibold">Instructor: {activeModalItem.instructor}</p>
                <p className="text-blue-700 mt-0.5">Deadline: {activeModalItem.deadline} • Max Marks: {activeModalItem.maxMarks}</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveModalItem(null)}
                  className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-600 border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Transmitting..." : "Confirm & Submit"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
