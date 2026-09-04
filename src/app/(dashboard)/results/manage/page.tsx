"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { BookOpen, GraduationCap, Save, RefreshCcw, Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { registryService } from "@/services/registry.service";
import { toast } from "sonner";
import { calculateFinalMarks, calculateAttendanceMarks, calculateCIAMarks, calculateTestMarks } from "@/services/marks.service";

export default function MarksManagementPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const fetchClassesAndSubjects = async () => {
    try {
      setLoading(true);
      const [classRes, subjectRes] = await Promise.all([
        supabase.from('classes').select('*').order('name'),
        supabase.from('subjects').select('*').order('name')
      ]);

      if (classRes.data && classRes.data.length > 0) {
        setClasses(classRes.data);
        setSelectedClass(classRes.data[0].id);
      }
      if (subjectRes.data && subjectRes.data.length > 0) {
        setSubjects(subjectRes.data);
        setSelectedSubject(subjectRes.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching classes/subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await registryService.getStudentsByClassWithMarks(selectedClass, selectedSubject);
      
      const studentsWithMarks = data.map(s => {
        const m = s.marks || {};
        return {
          ...s,
          cia1: Number(m.cia1) || 8,
          cia2: Number(m.cia2) || 9,
          test1: Number(m.test1) || 22,
          test2: Number(m.test2) || 24,
          attendancePercentage: s.attendance || 92
        };
      });

      setStudents(studentsWithMarks);
    } catch {
      toast.error("Failed to load student registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesAndSubjects();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedSubject]);

  const updateMark = (studentId: string, field: string, value: number) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, [field]: value } : s
    ));
  };

  const saveMarks = async () => {
    try {
      setSaving(true);
      if (isSupabaseConfigured) {
        const promises = students.map(s => {
          const attendanceMarks = calculateAttendanceMarks(s.attendancePercentage);
          const ciaTotal = calculateCIAMarks(s.cia1, s.cia2);
          const testScore = calculateTestMarks(s.test1, s.test2);
          const finalMarks = calculateFinalMarks(attendanceMarks, ciaTotal, testScore);

          return registryService.updateStudentMarks(s.id, selectedSubject, {
            cia1: s.cia1,
            cia2: s.cia2,
            test1: s.test1,
            test2: s.test2,
            attendance_marks: attendanceMarks,
            cia_total: ciaTotal,
            test_marks: testScore,
            final_marks: finalMarks,
            attendance_percentage: s.attendancePercentage
          });
        });
        await Promise.all(promises);
      }
      
      toast.success("Institutional records updated", {
        description: "All CIA and test marks have been synchronized with the main registry."
      });
    } catch {
      toast.error("Failed to synchronize marks");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="flex flex-col min-h-full space-y-6">
        <Header title="Continuous Internal Assessment (CIA) Evaluation Ledger" showBack />
        
        <div className="space-y-6">
          {/* Top Controls Toolbar */}
          <Card className="p-4 border-slate-200 bg-white shadow-sm rounded-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 h-10 bg-slate-50">
                  <GraduationCap className="w-4 h-4 text-slate-500" />
                  <select 
                    className="bg-transparent border-none text-slate-900 font-semibold text-xs focus:ring-0 cursor-pointer outline-none"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 h-10 bg-slate-50">
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <select 
                    className="bg-transparent border-none text-slate-900 font-semibold text-xs focus:ring-0 cursor-pointer outline-none"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                  >
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input 
                    placeholder="Search student..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-10 rounded-lg border-slate-200 bg-slate-50 text-xs w-48 font-medium"
                  />
                </div>
              </div>

              <Button 
                disabled={students.length === 0 || saving}
                onClick={saveMarks}
                size="sm"
                className="h-10 px-5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 shadow-sm gap-2"
              >
                {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Evaluation"}
              </Button>
            </div>
          </Card>

          {/* Marks Entry Grid */}
          <Card className="rounded-xl shadow-sm border border-slate-200 bg-white overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                   <thead className="text-[11px] uppercase text-slate-500 bg-slate-50/80 border-b border-slate-100 font-semibold">
                      <tr>
                         <th className="py-3 px-5">Student Details</th>
                         <th className="py-3 px-3">Attendance %</th>
                         <th className="py-3 px-3 text-center">CIA 1 (10)</th>
                         <th className="py-3 px-3 text-center">CIA 2 (10)</th>
                         <th className="py-3 px-3 text-center">Test 1 (25)</th>
                         <th className="py-3 px-3 text-center">Test 2 (25)</th>
                         <th className="py-3 px-5 text-right">Computed Final</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 font-medium">
                      <AnimatePresence mode="popLayout">
                         {filteredStudents.map((s, i) => {
                            const attPts = calculateAttendanceMarks(s.attendancePercentage);
                            const ciaTotal = calculateCIAMarks(s.cia1, s.cia2);
                            const testPts = calculateTestMarks(s.test1, s.test2);
                            const final = calculateFinalMarks(attPts, ciaTotal, testPts);
                            
                            return (
                               <motion.tr 
                                 key={s.id}
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 className="hover:bg-slate-50 transition-colors"
                               >
                                  <td className="py-3.5 px-5">
                                      <p className="font-bold text-slate-900">{s.name}</p>
                                      <p className="text-[11px] text-slate-400">{s.roll_number}</p>
                                  </td>
                                  <td className="py-3.5 px-3">
                                     <span className={cn(
                                       "px-2 py-0.5 rounded text-[11px] font-bold border",
                                       s.attendancePercentage >= 75 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                                     )}>
                                       {s.attendancePercentage}%
                                     </span>
                                  </td>
                                  <td className="py-3.5 px-3 text-center">
                                     <input 
                                       type="number"
                                       max={10}
                                       min={0}
                                       value={s.cia1}
                                       onChange={(e) => updateMark(s.id, 'cia1', Number(e.target.value))}
                                       className="w-14 h-8 bg-slate-50 border border-slate-200 rounded-md text-center text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                                     />
                                  </td>
                                  <td className="py-3.5 px-3 text-center">
                                     <input 
                                       type="number"
                                       max={10}
                                       min={0}
                                       value={s.cia2}
                                       onChange={(e) => updateMark(s.id, 'cia2', Number(e.target.value))}
                                       className="w-14 h-8 bg-slate-50 border border-slate-200 rounded-md text-center text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                                     />
                                  </td>
                                  <td className="py-3.5 px-3 text-center">
                                     <input 
                                       type="number"
                                       max={25}
                                       min={0}
                                       value={s.test1}
                                       onChange={(e) => updateMark(s.id, 'test1', Number(e.target.value))}
                                       className="w-14 h-8 bg-slate-50 border border-slate-200 rounded-md text-center text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                                     />
                                  </td>
                                  <td className="py-3.5 px-3 text-center">
                                     <input 
                                       type="number"
                                       max={25}
                                       min={0}
                                       value={s.test2}
                                       onChange={(e) => updateMark(s.id, 'test2', Number(e.target.value))}
                                       className="w-14 h-8 bg-slate-50 border border-slate-200 rounded-md text-center text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                                     />
                                  </td>
                                  <td className="py-3.5 px-5 text-right">
                                     <div className="flex items-baseline justify-end gap-1">
                                        <span className="font-bold text-slate-900 text-sm">{final}</span>
                                        <span className="text-[10px] text-slate-400">/ 20</span>
                                     </div>
                                  </td>
                               </motion.tr>
                            );
                         })}
                      </AnimatePresence>
                   </tbody>
                </table>
                {filteredStudents.length === 0 && (
                   <div className="py-20 flex flex-col items-center justify-center text-center">
                      <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                      <h4 className="font-bold text-slate-700 text-xs">No Students Found</h4>
                      <p className="text-xs text-slate-400">Try adjusting your search criteria.</p>
                   </div>
                )}
             </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
