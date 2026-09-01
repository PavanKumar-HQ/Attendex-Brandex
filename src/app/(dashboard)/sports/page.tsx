"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Medal, Trophy, Users, Plus, Save, Trash2, Search, Filter, RefreshCcw, Star, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";
import { academicService } from "@/services/academic";

interface EventEntry {
  id?: string;
  category: string;
  class_id: string;
  position: "1st" | "2nd" | "3rd" | "Participant";
  points: number;
}

export default function SportsEntryPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<EventEntry[]>([
    { category: "100m Sprint", class_id: "cls-1", position: "1st", points: 5 },
    { category: "Relay Race", class_id: "cls-2", position: "2nd", points: 3 },
    { category: "Cricket", class_id: "cls-3", position: "1st", points: 5 }
  ]);
  const [classes, setClasses] = useState<any[]>([
    { id: "cls-1", name: "B.Tech Computer Science 4A" },
    { id: "cls-2", name: "B.Tech AI & Data Science 3B" },
    { id: "cls-3", name: "B.Tech Electronics 4B" }
  ]);
  const [categories, setCategories] = useState([
    "100m Sprint", "200m Sprint", "Relay Race", "Tug of War", 
    "Long Jump", "High Jump", "Cricket", "Football", "Volleyball", "Chess"
  ]);
  const [newCategory, setNewCategory] = useState("");

  const fetchInitialData = async () => {
    if (!isSupabaseConfigured) return;
    try {
      setLoading(true);
      const { data: classData } = await supabase.from('classes').select('*');
      if (classData && classData.length > 0) setClasses(classData);
    } catch {
      // keep mock
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const addEntry = () => {
    setEntries([
      ...entries,
      { category: categories[0], class_id: classes[0]?.id || "cls-1", position: "1st", points: 5 }
    ]);
  };

  const updateEntry = (index: number, field: keyof EventEntry, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    
    if (field === "position") {
      const pointMap = { "1st": 5, "2nd": 3, "3rd": 1, "Participant": 0 };
      newEntries[index].points = pointMap[value as keyof typeof pointMap];
    }
    
    setEntries(newEntries);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (entries.length === 0) return;
    try {
      setSaving(true);
      if (isSupabaseConfigured) {
        await academicService.saveSportsPoints(entries);
      }
      toast.success("Sports achievements saved", {
        description: `Successfully recorded ${entries.length} achievements.`
      });
    } catch {
      toast.error("Failed to save records");
    } finally {
      setSaving(false);
    }
  };

  const addNewCategory = () => {
    if (!newCategory.trim()) return;
    if (categories.includes(newCategory.trim())) {
      toast.error("Sport already exists");
      return;
    }
    setCategories([...categories, newCategory.trim()]);
    setNewCategory("");
    toast.success("Sport added to list");
  };

  return (
    <PageTransition>
      <div className="flex flex-col min-h-full space-y-6">
        <Header title="Sports & Extra-Curricular Points Registry" />
        
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* Control Panel */}
            <div className="w-full lg:w-72 space-y-4">
               <Card className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Manage Entries</h3>
                    <p className="text-xs text-slate-500 font-medium">Record annual sports achievements</p>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      onClick={addEntry}
                      size="sm"
                      className="w-full h-10 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Sport Entry
                    </Button>
                    <Button 
                      disabled={entries.length === 0 || saving}
                      onClick={handleSave}
                      size="sm"
                      variant="outline"
                      className="w-full h-10 rounded-lg border-blue-200 bg-blue-50 text-blue-700 font-semibold text-xs hover:bg-blue-100 transition-all gap-2 disabled:opacity-50"
                    >
                      {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                      {saving ? "Saving..." : "Commit Results"}
                    </Button>
                  </div>
               </Card>

               <Card className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                  <p className="text-xs font-semibold text-slate-700">Add New Sport Category</p>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="e.g. Swimming" 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="h-9 rounded-lg border-slate-200 text-xs"
                    />
                    <Button 
                      onClick={addNewCategory}
                      size="sm"
                      className="h-9 w-9 p-0 rounded-lg bg-slate-900 text-white shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
               </Card>

               <Card className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-sm space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900">Merit Scale</h4>
                  </div>
                  <div className="space-y-1.5 text-xs">
                     <PointRule rank="1st Place" pts={5} />
                     <PointRule rank="2nd Place" pts={3} />
                     <PointRule rank="3rd Place" pts={1} />
                     <PointRule rank="Participant" pts={0} />
                  </div>
               </Card>
            </div>

            {/* Entry Table */}
            <div className="flex-1 w-full">
               <Card className="rounded-xl shadow-sm border border-slate-200 bg-white overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                     <div>
                        <h3 className="text-sm font-bold text-slate-900">Current Session Records</h3>
                        <p className="text-xs text-slate-500 font-medium">{entries.length} achievements ready to save</p>
                     </div>
                  </div>

                  <div className="p-4">
                     <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                           <thead className="text-[11px] uppercase text-slate-500 bg-slate-50 font-semibold">
                              <tr>
                                 <th className="py-2.5 px-3">Sport / Event</th>
                                 <th className="py-2.5 px-3">Class / Batch</th>
                                 <th className="py-2.5 px-3">Placement</th>
                                 <th className="py-2.5 px-3">Points</th>
                                 <th className="py-2.5 px-3 text-right">Action</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 font-medium">
                              <AnimatePresence mode="popLayout">
                                 {entries.map((entry, idx) => (
                                    <motion.tr 
                                      key={idx}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                    >
                                       <td className="py-3 px-3">
                                          <select 
                                            value={entry.category}
                                            onChange={(e) => updateEntry(idx, "category", e.target.value)}
                                            className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none"
                                          >
                                             {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                          </select>
                                       </td>
                                       <td className="py-3 px-3">
                                          <select 
                                            value={entry.class_id}
                                            onChange={(e) => updateEntry(idx, "class_id", e.target.value)}
                                            className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none"
                                          >
                                             {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                          </select>
                                       </td>
                                       <td className="py-3 px-3">
                                          <select 
                                            value={entry.position}
                                            onChange={(e) => updateEntry(idx, "position", e.target.value)}
                                            className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none"
                                          >
                                             <option value="1st">1st Place</option>
                                             <option value="2nd">2nd Place</option>
                                             <option value="3rd">3rd Place</option>
                                             <option value="Participant">Participant</option>
                                          </select>
                                       </td>
                                       <td className="py-3 px-3">
                                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                                            +{entry.points}
                                          </span>
                                       </td>
                                       <td className="py-3 px-3 text-right">
                                          <button 
                                            onClick={() => removeEntry(idx)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                          >
                                             <Trash2 className="w-4 h-4" />
                                          </button>
                                       </td>
                                    </motion.tr>
                                 ))}
                              </AnimatePresence>
                           </tbody>
                        </table>
                        {entries.length === 0 && (
                           <div className="py-16 text-center text-slate-400 text-xs font-medium">
                              No entries in this session. Click "Add Sport Entry" to log points.
                           </div>
                        )}
                     </div>
                  </div>
               </Card>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function PointRule({ rank, pts }: { rank: string, pts: number }) {
  return (
    <div className="flex items-center justify-between text-xs font-medium text-slate-700">
       <span>{rank}</span>
       <span className="font-bold text-emerald-800">+{pts} Pts</span>
    </div>
  );
}
