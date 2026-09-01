"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Library, 
  BookOpen, 
  Download, 
  FileText, 
  Layers, 
  ExternalLink, 
  CheckCircle2, 
  ChevronRight,
  FolderGit2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COURSES = [
  {
    id: "cs801",
    code: "CS801",
    title: "Distributed Systems & Cloud Computing",
    instructor: "Prof. R. Sharma",
    credits: 4,
    units: [
      { unit: "Unit 1", name: "Distributed System Models & IPC", topics: "RPC, RMI, Client-Server architecture, Message-oriented communication", slides: "Unit1_IPC_Models.pdf" },
      { unit: "Unit 2", name: "Clock Synchronization & Consensus", topics: "Lamport timestamps, Vector clocks, Raft & Paxos consensus algorithms", slides: "Unit2_Consensus_Clocks.pdf" },
      { unit: "Unit 3", name: "Distributed File Systems & Storage", topics: "NFS, HDFS architecture, Consistency models, Replication protocols", slides: "Unit3_HDFS_Replication.pdf" },
      { unit: "Unit 4", name: "Cloud Virtualization & Containers", topics: "Hypervisors, Docker containerization, Kubernetes cluster orchestration", slides: "Unit4_K8s_Cloud.pdf" },
      { unit: "Unit 5", name: "Fault Tolerance & Security", topics: "Byzantine fault tolerance, Kerberos authentication, Cloud disaster recovery", slides: "Unit5_BFT_Security.pdf" },
    ],
    pyqs: ["Distributed_Systems_EndSem_2025.pdf", "Distributed_Systems_EndSem_2024.pdf"]
  },
  {
    id: "ai602",
    code: "AI602",
    title: "Deep Learning & Neural Networks",
    instructor: "Dr. K. Nair",
    credits: 4,
    units: [
      { unit: "Unit 1", name: "Feedforward Networks & Optimization", topics: "Backpropagation, SGD, Adam optimizer, Activation functions", slides: "DL_Unit1_Optimizers.pdf" },
      { unit: "Unit 2", name: "Convolutional Neural Networks", topics: "Convolutions, Pooling, ResNet, EfficientNet architectures for CV", slides: "DL_Unit2_CNNs.pdf" },
      { unit: "Unit 3", name: "Recurrent & Attention Architectures", topics: "LSTMs, GRUs, Self-Attention mechanism, Transformer encoders", slides: "DL_Unit3_Transformers.pdf" },
      { unit: "Unit 4", name: "Generative AI Models", topics: "VAEs, GANs, Latent Diffusion models, Stable Diffusion fundamentals", slides: "DL_Unit4_GenAI.pdf" },
    ],
    pyqs: ["Deep_Learning_EndSem_2025.pdf"]
  },
  {
    id: "it401",
    code: "IT401",
    title: "Database Architecture & Optimization",
    instructor: "Dr. P. Patel",
    credits: 3,
    units: [
      { unit: "Unit 1", name: "Query Processing & Cost Estimation", topics: "Relational algebra optimization, Query plans, Index selection", slides: "DB_Unit1_QueryOptimizer.pdf" },
      { unit: "Unit 2", name: "Concurrency Control & ARIES", topics: "Two-Phase Locking (2PL), MVCC, Write-Ahead Logging (WAL)", slides: "DB_Unit2_ARIES_2PL.pdf" },
      { unit: "Unit 3", name: "Distributed & NoSQL Databases", topics: "CAP theorem, DynamoDB, MongoDB sharding, Distributed transactions", slides: "DB_Unit3_NoSQL_CAP.pdf" },
    ],
    pyqs: ["DB_Architecture_EndSem_2025.pdf"]
  }
];

export default function StudentCurriculumPage() {
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0]);

  const handleDownload = (filename: string) => {
    toast.success("Downloading Academic Resource", {
      description: `${filename} saved to your device.`
    });
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full bg-slate-50">
        <Header title="Course Curriculum &amp; Digital Materials" showBack />

        <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
          {/* Header Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                  Semester 8 Scheme
                </span>
                <span className="text-xs font-semibold text-slate-400">Department of CSE</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">University Syllabus &amp; Course Notes</h1>
              <p className="text-xs text-slate-500 font-medium">
                Official unit-wise lecture notes, faculty slides, reference textbooks, and previous year question papers.
              </p>
            </div>

            <Button
              onClick={() => handleDownload("Complete_Semester8_Syllabus_Booklet.pdf")}
              className="h-9 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Full Syllabus Booklet</span>
            </Button>
          </div>

          {/* Course Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {COURSES.map((course) => (
              <button
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap text-left",
                  selectedCourse.id === course.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm font-bold"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                <span className="text-[10px] block opacity-75 font-mono">{course.code}</span>
                <span>{course.title}</span>
              </button>
            ))}
          </div>

          {/* Selected Course Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Units & Syllabus List (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Unit Breakdown ({selectedCourse.units.length} Modules)
              </h3>

              <div className="space-y-3">
                {selectedCourse.units.map((u, idx) => (
                  <Card key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-200 transition-all space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {u.unit}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{u.name}</h4>
                        <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">{u.topics}</p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(u.slides)}
                        className="h-8 px-3 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span>Slides PDF</span>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Course Metadata & PYQ Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Course Info */}
              <Card className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Course Overview</h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Instructor</span>
                    <p className="font-bold text-slate-900">{selectedCourse.instructor}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Academic Credits</span>
                    <p className="font-bold text-slate-900">{selectedCourse.credits} Credits (4 Hours / Week)</p>
                  </div>
                </div>
              </Card>

              {/* PYQ Question Papers */}
              <Card className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  Past Examination Papers
                </h3>
                <div className="space-y-2">
                  {selectedCourse.pyqs.map((paper, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-800 truncate">{paper}</span>
                      <button
                        onClick={() => handleDownload(paper)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
