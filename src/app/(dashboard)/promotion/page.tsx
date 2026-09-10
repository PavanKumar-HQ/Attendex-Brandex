"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, ShieldCheck, AlertTriangle, History, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { academicService } from "@/services/academic";
import { useEffect } from "react";

export default function PromotionPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [isPromoting, setIsPromoting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoading(true);
        const data = await academicService.getClasses();
        setClasses(data || []);
      } catch (err) {
        toast.error("Failed to load classes for promotion");
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, []);

  const toggleClass = (id: string) => {
    const next = new Set(selectedClasses);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedClasses(next);
  };

  const handlePromote = async () => {
    if (selectedClasses.size === 0) {
      toast.error("Select at least one class to promote");
      return;
    }
    try {
      setIsPromoting(true);
      const res = await fetch("/api/promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_ids: Array.from(selectedClasses) })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Promotion failed");

      setShowConfirm(false);
      setSelectedClasses(new Set());
      toast.success("Batch Promotion Successful!", {
        description: json.message || "Classes and students advanced to next academic year."
      });

      // Reload updated classes
      const updatedClasses = await academicService.getClasses();
      setClasses(updatedClasses || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to promote batches");
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col h-full">
        <Header title="Batch Promotion" />
        
        <div className="flex-1 space-y-8 max-w-5xl mx-auto w-full pb-20">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Academic Year Transition</h2>
            <p className="text-slate-500">Bulk promote students or manage graduation for the 2023-24 batch.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 md:col-span-2 border-slate-200 shadow-sm rounded-2xl bg-white space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4 text-blue-500" />
                  Select Batches to Promote
                </h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedClasses.size} Selected</span>
              </div>

              <div className="space-y-3">
                {classes.map((c) => (
                  <div 
                    key={c.id} 
                    onClick={() => toggleClass(c.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      selectedClasses.has(c.id) 
                        ? 'border-blue-500 bg-blue-50/50' 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedClasses.has(c.id) ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                        {c.year > 2025 ? <GraduationCap className="w-5 h-5" /> : <RefreshCcw className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.department || 'General'} • Batch {c.year}</p>
                      </div>
                    </div>
                    {selectedClasses.has(c.id) && <ShieldCheck className="w-6 h-6 text-blue-600" />}
                  </div>
                ))}
                {!loading && classes.length === 0 && (
                  <div className="py-10 text-center text-slate-300 italic font-medium">No active classrooms identified for promotion.</div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <Button 
                    disabled={selectedClasses.size === 0}
                    onClick={() => setShowConfirm(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-8 font-bold h-12 shadow-lg shadow-slate-200"
                >
                    Review Promotion
                </Button>
              </div>
            </Card>

            <div className="space-y-6">
               <Card className="p-6 border-amber-200/80 shadow-xs rounded-2xl bg-amber-50/70 text-amber-950">
                  <h4 className="font-bold mb-4 flex items-center gap-2 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Crucial Notes
                  </h4>
                  <ul className="text-xs space-y-3 text-amber-900/80 font-medium">
                    <li>• History will be archived. Attendance resets to 0% for the new year.</li>
                    <li>• Roll numbers remain unchanged.</li>
                    <li>• Graduation status will be applied to Final Year students.</li>
                  </ul>
               </Card>
               
               <Card className="p-6 border-slate-200 shadow-sm rounded-2xl bg-white">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" />
                    Recent Logs
                  </h4>
                  <div className="space-y-4 py-8 text-center">
                    <History className="w-8 h-8 text-slate-100 mx-auto" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Logs Empty</p>
                  </div>
               </Card>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
                >
                    <div className="p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-blue-50/50">
                            {isPromoting ? <RefreshCcw className="w-10 h-10 animate-spin" /> : <GraduationCap className="w-10 h-10" />}
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-slate-900">Final Confirmation</h3>
                            <p className="text-slate-500 text-sm">
                                You are about to promote <strong>{selectedClasses.size} batches</strong>. This will finalize current academic records.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3 text-left">
                           <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                           <p className="text-xs text-amber-700 font-medium leading-relaxed">
                             This action is irreversible. All current attendance percentages will be cleared for selected students.
                           </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button 
                                onClick={handlePromote} 
                                disabled={isPromoting}
                                className="h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl"
                            >
                                {isPromoting ? "Promoting..." : "Confirm & Execute"}
                            </Button>
                            <Button variant="ghost" className="h-10 text-slate-400" onClick={() => setShowConfirm(false)}>Cancel</Button>
                        </div>
                    </div>
                </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
