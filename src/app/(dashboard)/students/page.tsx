"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Search, Plus, MoreHorizontal, UploadCloud, FileSpreadsheet, UserRoundPen, History, Trash2, AlertCircle, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fuzzySearch, cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { StudentProfile } from "@/components/students/student-profile";
import { academicService } from "@/services/academic";

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [studentList, setStudentList] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form States
  const [formData, setFormData] = useState<{ name: string, roll: string, email: string, class: string, parent_email: string }>({
    name: "", roll: "", email: "", class: "", parent_email: ""
  });

  const handleFormChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const loadData = async (p = page) => {
    try {
      setLoading(true);
      const [result, clsList] = await Promise.all([
        academicService.getAllStudents(p, PAGE_SIZE),
        academicService.getClasses()
      ]);
      setStudentList(result.data || []);
      setTotalCount(result.count || 0);
      setClasses(clsList || []);
    } catch (err) {
      toast.error("Failed to load records from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(page); }, [page]);

  const filteredStudents = studentList.filter(s => {
    const matchesSearch = fuzzySearch(search, `${s.name} ${s.roll_number} ${s.email}`);
    const matchesSection = selectedSection === "all" || s.classes?.section === selectedSection;
    return matchesSearch && matchesSection;
  });

  const [importStatus, setImportStatus] = useState<'idle' | 'reading' | 'mapping' | 'success'>('idle');
  const [importProgress, setImportProgress] = useState(0);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !formData.class) return toast.error("Please select a target class first");

    setIsUploading(true);
    setImportStatus('reading');
    setImportProgress(10);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setImportStatus('mapping');
        setImportProgress(30);

        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== "");
        if (lines.length < 2) throw new Error("File is empty or missing data.");

        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        const required = ['name', 'roll', 'email'];

        const missing = required.filter(r => !headers.includes(r));
        if (missing.length > 0) throw new Error(`Missing required headers: ${missing.join(", ")}`);

        const nameIdx = headers.indexOf('name');
        const rollIdx = headers.indexOf('roll');
        const emailIdx = headers.indexOf('email');
        const parentIdx = headers.indexOf('parent_email');
        const tcIdx = headers.indexOf('tc');
        const tpIdx = headers.indexOf('tp');

        const headerIndices: Record<string, number> = {};
        headers.forEach((h, i) => { headerIndices[h] = i; });

        const tcCols = headers.filter(h => h.startsWith('tc_'));
        const subjectList = await academicService.getSubjects({ department: classes.find(c => c.id === formData.class)?.department });

        const newStudentsData = lines.slice(1).map((line) => {
          const values = line.split(',').map(v => v.trim());
          const student = {
            name: values[headerIndices['name']],
            roll_number: values[headerIndices['roll']],
            email: values[headerIndices['email']],
            parent_email: headerIndices['parent_email'] !== undefined ? values[headerIndices['parent_email']] : null,
            initial_total_classes: headerIndices['tc'] !== undefined ? parseInt(values[headerIndices['tc']]) || 0 : 0,
            initial_total_present: headerIndices['tp'] !== undefined ? parseInt(values[headerIndices['tp']]) || 0 : 0,
            class_id: formData.class,
            department: classes.find(c => c.id === formData.class)?.department || 'General'
          };

          const initialAttendance = tcCols.map(tcCol => {
            const suffix = tcCol.replace('tc_', '').toLowerCase();
            const tpCol = `tp_${suffix}`;

            // Try to find a matching subject
            const matchedSubject = subjectList.find((s: any) =>
              s.code.toLowerCase().includes(suffix) ||
              s.name.toLowerCase().includes(suffix)
            );

            return {
              subject_code: matchedSubject ? matchedSubject.code : suffix.toUpperCase(),
              total_classes: parseInt(values[headerIndices[tcCol]]) || 0,
              total_present: parseInt(values[headerIndices[tpCol]]) || 0
            };
          });

          return { student, initialAttendance };
        });

        setImportProgress(60);
        const studentsToInsert = newStudentsData.map(d => d.student);
        const insertedStudents = await academicService.importStudents(studentsToInsert);

        // Map initial attendance to student IDs
        const initialRecords: any[] = [];
        insertedStudents.forEach((st: any) => {
          const original = newStudentsData.find(d => d.student.roll_number === st.roll_number);
          if (original) {
            original.initialAttendance.forEach(rec => {
              initialRecords.push({
                student_id: st.id,
                ...rec
              });
            });
          }
        });

        if (initialRecords.length > 0) {
          await academicService.importInitialAttendance(initialRecords);
        }

        setImportProgress(100);
        setImportStatus('success');
        toast.success(`Successfully synchronized ${newStudentsData.length} students to the cloud.`);
        loadData();
        setTimeout(() => {
          setIsImportOpen(false);
          setIsUploading(false);
        }, 1000);

      } catch (err: any) {
        toast.error("Format Error", { description: err.message });
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.roll || !formData.class) return toast.error("Missing required fields");
    try {
      await academicService.addStudent({
        name: formData.name,
        roll_number: formData.roll,
        email: formData.email,
        parent_email: formData.parent_email,
        class_id: formData.class,
        department: classes.find(c => c.id === formData.class)?.department || 'General'
      });
      toast.success("Student records persisted to database");
      setIsAddOpen(false);
      loadData();
    } catch (err) {
      toast.error("Failed to create record");
    }
  };

  const handleUpdate = async () => {
    try {
      await academicService.updateStudent(selectedStudent.id, {
        name: formData.name,
        roll_number: formData.roll,
        email: formData.email,
        parent_email: formData.parent_email
      });
      toast.success("Profile updated in registry");
      setIsEditOpen(false);
      loadData();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    try {
      await academicService.deleteStudent(selectedStudent.id);
      toast.success("Record purged from database");
      setIsDeleteOpen(false);
      loadData();
    } catch (err) {
      toast.error("Deletion failed");
    }
  };

  const handleAction = (type: 'edit' | 'history' | 'delete', student: any) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      roll: student.roll_number,
      email: student.email,
      class: student.class_id,
      parent_email: student.parent_email || ""
    });
    if (type === 'edit') setIsEditOpen(true);
    if (type === 'history') setIsHistoryOpen(true);
    if (type === 'delete') setIsDeleteOpen(true);
  };

  // Loading state moved inline to prevent screen blanking

  return (
    <PageTransition>
      <div className="flex flex-col min-h-full">
        <Header title="Institutional Roster" />

          {/* Clean Action & Search Toolbar */}
          <Card className="p-3 border-slate-200 bg-white shadow-sm rounded-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by student name, roll number, or email..."
                  className="pl-9 h-10 rounded-lg border-slate-200 bg-slate-50 text-slate-900 text-xs focus-visible:ring-slate-900"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Select value={selectedSection} onValueChange={(v) => v && setSelectedSection(v)}>
                  <SelectTrigger className="w-[120px] h-10 border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg">
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-slate-200">
                    <SelectItem value="all">All Sections</SelectItem>
                    <SelectItem value="A">Section A</SelectItem>
                    <SelectItem value="B">Section B</SelectItem>
                    <SelectItem value="C">Section C</SelectItem>
                  </SelectContent>
                </Select>

                <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                  <DialogTrigger render={
                    <Button variant="outline" size="sm" className="h-10 rounded-lg border-slate-200 text-slate-700 font-semibold text-xs gap-1.5 hover:bg-slate-50">
                      <UploadCloud className="w-4 h-4 text-blue-600" />
                      <span>Bulk CSV</span>
                    </Button>
                  } />
                  <DialogContent className="w-[95vw] max-w-[450px] rounded-xl p-6 bg-white border border-slate-200 shadow-lg">
                    <DialogHeader className="space-y-1">
                      <DialogTitle className="text-lg font-bold text-slate-900">Import Student Roster</DialogTitle>
                      <DialogDescription className="text-slate-500 text-xs">
                        Upload a CSV file to enroll multiple students at once.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Target Classroom</Label>
                        <Select onValueChange={(v) => v && handleFormChange('class', String(v))}>
                          <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white font-medium text-xs">
                            <SelectValue placeholder="Select Class" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg border-slate-200">
                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.section || 'A'})</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                        <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Required Columns</p>
                        <div className="flex gap-2">
                          {['name', 'roll', 'email'].map(col => (
                            <span key={col} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700">{col}</span>
                          ))}
                        </div>
                      </div>

                      <Label htmlFor="csv-upload" className="block p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/20 transition-all cursor-pointer text-center bg-slate-50">
                        <UploadCloud className="w-7 h-7 text-blue-600 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-700">Click to choose CSV file</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Maximum size: 5MB</p>
                        <Input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={isUploading || !formData.class} />
                      </Label>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger render={
                    <Button
                      onClick={() => setFormData({ name: "", roll: "", email: "", class: "", parent_email: "" })}
                      size="sm"
                      className="h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs gap-1.5 px-4 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Enroll Student</span>
                    </Button>
                  } />
                  <DialogContent className="w-[95vw] max-w-[480px] rounded-xl p-6 bg-white border border-slate-200 shadow-lg">
                    <DialogHeader className="space-y-1 mb-4">
                      <DialogTitle className="text-lg font-bold text-slate-900">Enroll New Student</DialogTitle>
                      <DialogDescription className="text-slate-500 text-xs">Enter student credentials to create a verified record.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs font-semibold text-slate-700">Full Name</Label>
                        <Input placeholder="e.g. Rahul Deshmukh" className="h-10 rounded-lg border-slate-200 text-xs" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Roll Number</Label>
                        <Input placeholder="21CS042" className="h-10 rounded-lg border-slate-200 text-xs" value={formData.roll} onChange={e => setFormData({ ...formData, roll: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Classroom</Label>
                        <Select onValueChange={(v) => v && handleFormChange('class', String(v))}>
                          <SelectTrigger className="h-10 rounded-lg border-slate-200 text-xs">
                            <SelectValue placeholder="Select Class" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs font-semibold text-slate-700">Official Student Email</Label>
                        <Input placeholder="student@institution.edu" className="h-10 rounded-lg border-slate-200 text-xs" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                      </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-10 rounded-lg text-xs" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                      <Button size="sm" className="h-10 rounded-lg bg-slate-900 text-white font-semibold text-xs px-5" onClick={handleCreate}>Save Enrollment</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="text-[11px] uppercase text-slate-500 bg-slate-50 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Full Identity</th>
                    <th className="px-6 py-4">Roll Unit</th>
                    <th className="px-6 py-4">Classroom</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4 w-[60px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && studentList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                        <p className="text-sm font-semibold text-slate-500">Synchronizing Institutional Roster...</p>
                      </td>
                    </tr>
                  ) : filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => { setSelectedStudent(st); setIsProfileOpen(true); }}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 leading-tight">{st.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">{st.email}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{st.roll_number}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-sm">
                          {st.classes?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-500 text-[11px] uppercase tracking-wider">
                        {st.department || 'General'}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" className="h-8 w-8 rounded-lg hover:bg-slate-100 outline-none p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 bg-white border border-slate-200 shadow-lg">
                            <DropdownMenuItem onClick={() => handleAction('edit', st)} className="rounded-lg p-2.5 flex items-center gap-2 font-medium text-xs">
                              <UserRoundPen className="w-4 h-4 text-blue-600" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('history', st)} className="rounded-lg p-2.5 flex items-center gap-2 font-medium text-xs">
                              <History className="w-4 h-4 text-emerald-600" /> Attendance Ledger
                            </DropdownMenuItem>
                            <div className="h-px bg-slate-100 my-1" />
                            <DropdownMenuItem onClick={() => handleAction('delete', st)} className="rounded-lg p-2.5 flex items-center gap-2 font-medium text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                              <Trash2 className="w-4 h-4" /> Purge Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {filteredStudents.map((st) => (
                <div key={st.id} className="p-5 space-y-4 active:bg-slate-50 transition-colors" onClick={() => { setSelectedStudent(st); setIsProfileOpen(true); }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-bold text-slate-900 leading-tight text-sm truncate">{st.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">{st.email}</div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" className="h-9 w-9 rounded-xl hover:bg-slate-100 outline-none border border-slate-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-white border border-slate-100 shadow-2xl">
                          <DropdownMenuItem onClick={() => handleAction('edit', st)} className="rounded-xl p-3 flex items-center gap-3 font-bold text-xs">
                            <UserRoundPen className="w-4 h-4 text-blue-600" /> Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction('history', st)} className="rounded-xl p-3 flex items-center gap-3 font-bold text-xs">
                            <History className="w-4 h-4 text-emerald-600" /> Attendance Ledger
                          </DropdownMenuItem>
                          <div className="h-px bg-slate-50 my-2" />
                          <DropdownMenuItem onClick={() => handleAction('delete', st)} className="rounded-xl p-3 flex items-center gap-3 font-bold text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50/50">
                            <Trash2 className="w-4 h-4" /> Purge Record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-700 tracking-tighter">{st.roll_number}</span>
                    <span className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg text-[9px] font-black uppercase text-blue-600 tracking-tighter">{st.classes?.name || 'Unassigned'}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        {/* Delete Confirmation */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-[3rem] p-0 overflow-hidden bg-white border border-slate-200">
            <div className="p-10 text-center">
              <div className="w-20 h-20 rounded-[2.5rem] bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-rose-50/50">
                <Trash2 className="w-10 h-10" />
              </div>
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black text-center">PURGE STUDENT?</DialogTitle>
                <DialogDescription className="text-center font-bold text-slate-400">
                  Irreversible action. Deleting {selectedStudent?.name} will wipe all associated trail-run data.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <Button className="h-14 rounded-2xl bg-rose-600 text-white font-black uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-500/10" onClick={handleDelete}>Confirm Purge</Button>
                <Button variant="ghost" className="h-12 rounded-xl text-slate-400 font-bold text-xs" onClick={() => setIsDeleteOpen(false)}>Abort Action</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {isProfileOpen && (
          <StudentProfile student={selectedStudent} onClose={() => setIsProfileOpen(false)} />
        )}
      </div>
    </PageTransition>
  );
}
