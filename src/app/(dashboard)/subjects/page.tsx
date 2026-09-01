"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Library, Plus, Search, Filter, BookOpen, Hash, Layers, ShieldAlert, RefreshCcw } from "lucide-react";
import { subjectService, Subject } from "@/services/subjects";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const router = useRouter();

  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    department: "BCOM",
    year: 1,
    semester: 1
  });

  useEffect(() => {
    checkAdmin();
    loadSubjects();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(true); // Allow demo mode
        return;
      }

      const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

      setIsAdmin(true);
    } catch {
      setIsAdmin(true);
    }
  };

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch (err) {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newSubject.name || !newSubject.code) return toast.error("Essential fields missing");
    setIsSubmitting(true);
    try {
        await subjectService.createSubject(newSubject);
        toast.success("Subject Registered Successfully");
        setIsAddOpen(false);
        setNewSubject({
            name: "",
            code: "",
            department: "BCOM",
            year: 1,
            semester: 1
        });
        loadSubjects();
    } catch (err: any) {
        toast.error("Creation failed", { description: err.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingSubject) return;
    setIsSubmitting(true);
    try {
      await subjectService.updateSubject(editingSubject.id, {
        name: editingSubject.name,
        code: editingSubject.code,
        department: editingSubject.department,
        year: editingSubject.year,
        semester: editingSubject.semester
      });
      toast.success("Subject Blueprint Updated");
      setIsEditOpen(false);
      loadSubjects();
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase());
      const matchesDept = selectedDept === "all" || s.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [subjects, search, selectedDept]);

  if (isAdmin === false) return null;
  // Loading state moved inline to prevent screen blanking

  return (
    <PageTransition>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <Header
          title={
            <div className="flex items-center gap-2">
              <span className="text-slate-900 font-bold text-xl tracking-tight">Subject Registry</span>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-2" />
              <span className="text-slate-500 text-sm font-medium">{subjects.length} Blueprints</span>
            </div>
          }
        />

        <div className="flex-1 overflow-hidden flex flex-col pt-6 pb-24 px-4 md:px-0">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pb-6">
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search code or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 bg-white border-slate-200 rounded-lg shadow-sm font-medium text-sm"
                />
              </div>
              
              <Select value={selectedDept} onValueChange={(v) => v && setSelectedDept(v)}>
                <SelectTrigger className="w-[180px] h-10 bg-white border-slate-200 rounded-lg shadow-sm font-medium text-sm">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="BCOM">BCOM</SelectItem>
                  <SelectItem value="BBA">BBA</SelectItem>
                  <SelectItem value="BCA">BCA</SelectItem>
                  <SelectItem value="Commerce">Commerce</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setIsAddOpen(true)} className="h-10 px-5 rounded-lg bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              New Subject
            </Button>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogContent className="sm:max-w-[425px] rounded-xl p-0 overflow-hidden shadow-xl bg-white">
                <div className="p-6">
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-bold tracking-tight">Register Subject</DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium text-sm">
                      Add a new course blueprint to the institutional registry.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 ml-1">Course Identity</label>
                            <Input 
                                placeholder="e.g. Accounting" 
                                className="h-10 rounded-lg border-slate-200"
                                value={newSubject.name}
                                onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 ml-1">Subject Code</label>
                            <Input 
                                placeholder="e.g. BCM101" 
                                className="h-10 rounded-lg border-slate-200"
                                value={newSubject.code}
                                onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 ml-1">Institutional Department</label>
                        <Select value={newSubject.department} onValueChange={(v) => v && setNewSubject({...newSubject, department: v})}>
                            <SelectTrigger className="h-10 rounded-lg border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                                <SelectItem value="BCOM">BCOM</SelectItem>
                                <SelectItem value="BBA">BBA</SelectItem>
                                <SelectItem value="BCA">BCA</SelectItem>
                                <SelectItem value="Commerce">Commerce</SelectItem>
                                <SelectItem value="Science">Science</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 ml-1">Target Year</label>
                            <Select value={String(newSubject.year)} onValueChange={(v) => v && setNewSubject({...newSubject, year: parseInt(v)})}>
                                <SelectTrigger className="h-10 rounded-lg border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg">
                                    <SelectItem value="1">Year 1</SelectItem>
                                    <SelectItem value="2">Year 2</SelectItem>
                                    <SelectItem value="3">Year 3</SelectItem>
                                    <SelectItem value="4">Year 4</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 ml-1">Semester</label>
                            <Select value={String(newSubject.semester)} onValueChange={(v) => v && setNewSubject({...newSubject, semester: parseInt(v)})}>
                                <SelectTrigger className="h-10 rounded-lg border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg">
                                    {[1,2,3,4,5,6,7,8].map(s => (
                                        <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-0">
                    <Button 
                        className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-sm"
                        onClick={handleCreate}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Finalizing..." : "Create Blueprint"}
                    </Button>
                </div>
              </DialogContent>
          </Dialog>

          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent className="sm:max-w-[425px] rounded-xl p-0 overflow-hidden shadow-xl bg-white">
                {editingSubject && (
                  <>
                    <div className="p-6">
                      <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-bold tracking-tight">Update Blueprint</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium text-sm">
                          Refine course identity and academic mapping.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 ml-1">Course Identity</label>
                                <Input 
                                    className="h-10 rounded-lg border-slate-200"
                                    value={editingSubject.name}
                                    onChange={(e) => setEditingSubject({...editingSubject, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 ml-1">Subject Code</label>
                                <Input 
                                    className="h-10 rounded-lg border-slate-200"
                                    value={editingSubject.code}
                                    onChange={(e) => setEditingSubject({...editingSubject, code: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 ml-1">Institutional Department</label>
                            <Select value={editingSubject.department} onValueChange={(v) => v && setEditingSubject({...editingSubject, department: v})}>
                                <SelectTrigger className="h-10 rounded-lg border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg">
                                    <SelectItem value="BCOM">BCOM</SelectItem>
                                    <SelectItem value="BBA">BBA</SelectItem>
                                    <SelectItem value="BCA">BCA</SelectItem>
                                    <SelectItem value="Commerce">Commerce</SelectItem>
                                    <SelectItem value="Science">Science</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 ml-1">Target Year</label>
                                <Select value={String(editingSubject.year)} onValueChange={(v) => v && setEditingSubject({...editingSubject, year: parseInt(v)})}>
                                    <SelectTrigger className="h-10 rounded-lg border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                        {[1,2,3,4].map(y => (
                                            <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700 ml-1">Semester</label>
                                <Select value={String(editingSubject.semester)} onValueChange={(v) => v && setEditingSubject({...editingSubject, semester: parseInt(v)})}>
                                    <SelectTrigger className="h-10 rounded-lg border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                        {[1,2,3,4,5,6,7,8].map(s => (
                                            <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 pt-0">
                        <Button 
                            className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-sm"
                            onClick={handleUpdate}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Updating..." : "Update Blueprint"}
                        </Button>
                    </div>
                  </>
                )}
              </DialogContent>
          </Dialog>

          <Card className="flex-1 rounded-xl overflow-hidden bg-white border-slate-200 shadow-sm flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(loading || isAdmin === null) && subjects.length === 0 ? (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center">
                        <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                        <p className="text-sm font-semibold text-slate-500">Synchronizing Master Registry...</p>
                    </div>
                ) : (
                  <>
                    <AnimatePresence mode="popLayout">
                      {filteredSubjects.map((s, i) => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={s.id}
                          className="group p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Library className="w-12 h-12 text-slate-900" />
                          </div>
                          
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
                               <BookOpen className="w-5 h-5" />
                            </div>
                            <div className="px-2 py-0.5 rounded bg-slate-100 text-xs font-semibold text-slate-600">
                               {s.code}
                            </div>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight mb-2">{s.name}</h3>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 text-[11px] font-medium text-slate-600">
                               <Layers className="w-3 h-3" />
                               {s.department}
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 text-[11px] font-medium text-slate-600">
                               <Hash className="w-3 h-3" />
                               Year {s.year} • Sem {s.semester}
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                             <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[11px] font-medium text-slate-500">Active</span>
                             </div>
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                    setEditingSubject(s);
                                    setIsEditOpen(true);
                                }}
                                className="h-7 text-xs font-medium text-blue-600 hover:bg-blue-50"
                            >
                                Edit
                             </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {filteredSubjects.length === 0 && !loading && (
                        <div className="col-span-full py-16 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-3">
                                <Filter className="w-6 h-6" />
                            </div>
                            <p className="text-base font-bold text-slate-900">No blueprints match your criteria</p>
                            <p className="text-sm font-medium text-slate-500 mt-1">Refine your filters or create a new registry entry</p>
                        </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
