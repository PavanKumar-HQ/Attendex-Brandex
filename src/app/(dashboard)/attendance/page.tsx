"use client";

import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, WifiOff, CheckCircle2, CalendarIcon, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { offlineService } from "@/services/offline";
import { haptics } from "@/lib/haptics";
import { toast } from "sonner";
import { cn, fuzzySearch } from "@/lib/utils";
import { StudentProfile } from "@/components/students/student-profile";
import { academicService } from "@/services/academic";
import { subjectService, Subject } from "@/services/subjects";
import { supabase } from "@/lib/supabase";
import { StudentList } from "@/components/attendance/student-list";
import { AttendanceSyncDialog } from "@/components/attendance/sync-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { useStudents, useClasses } from "@/hooks/use-academic";
import { TableRowSkeleton } from "@/components/ui/skeletons";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";


export default function AttendancePage() {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedLecture, setSelectedLecture] = useState("L1");
  const [date, setDate] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [entryMode, setEntryMode] = useState<'list' | 'grid'>('list');
  const [absentIds, setAbsentIds] = useState<Set<string>>(new Set());
  const [onDutyIds, setOnDutyIds] = useState<Set<string>>(new Set());
  const [medicalIds, setMedicalIds] = useState<Set<string>>(new Set());
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Auto-hide filters on mobile if selections are made
  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      setShowFilters(false);
    } else {
      setShowFilters(true);
    }
  }, [selectedClassId, selectedSubjectId]);
  
  const queryClient = useQueryClient();
  const router = useRouter();

  // Queries
  const { data: classes = [], isLoading: classesLoading, refetch: refetchClasses } = useClasses();

  const { data: students = [], isLoading: studentsLoading, refetch: refetchStudents } = useStudents(selectedClassId, selectedSubjectId);

  const [userProfile, setUserProfile] = useState<any>({ role: 'ADMIN', full_name: 'Faculty Member' });
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
            supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
              if (data) setUserProfile(data);
            });
        }
    });
  }, []);

  const filteredClasses = useMemo(() => {
    if (!userProfile || userProfile.role === 'ADMIN') return classes;
    const claimed = classes.filter((c: any) => 
        c.class_claims?.some((claim: any) => claim.teacher_id === userProfile.id)
    );
    return claimed.length > 0 ? claimed : classes;
  }, [classes, userProfile]);

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects', selectedClassId],
    queryFn: async () => {
      const currentClass = classes.find((c: any) => c.id === selectedClassId);
      if (!currentClass) return [];
      return subjectService.getSubjects({ 
        department: currentClass.department, 
        year: currentClass.year,
        semester: currentClass.semester 
      });
    },
    enabled: !!selectedClassId && classes.length > 0,
  });

  useEffect(() => {
    if (filteredClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(filteredClasses[0].id);
    }
  }, [filteredClasses, selectedClassId]);

  useEffect(() => {
    setSelectedSubjectId("");
  }, [selectedClassId]);

  const handleRefresh = async () => {
    await Promise.all([refetchClasses(), refetchStudents()]);
    toast.success("Institutional Records Synced");
  };


  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', selectedClassId],
    queryFn: () => subjectService.getAssignmentsForClass(selectedClassId),
    enabled: !!selectedClassId,
  });

  const currentAssignment = useMemo(() => {
    return assignments.find((a: any) => a.subject_id === selectedSubjectId) || null;
  }, [assignments, selectedSubjectId]);

  const claimMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");
      return subjectService.claimSubject(selectedSubjectId, selectedClassId, user.id);
    },
    onSuccess: () => {
      toast.success("Subject Locked Successfully", { description: "You are now the primary faculty for this course." });
      queryClient.invalidateQueries({ queryKey: ['assignments', selectedClassId] });
    },
    onError: (err: any) => toast.error("Claim Failed", { description: err.message }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const periods = selectedLecture.startsWith('DP') 
        ? (selectedLecture === 'DP1' ? [1, 2] : [3, 4])
        : [parseInt(selectedLecture.replace('L', ''))];

      const formattedDate = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const attendanceData: any[] = [];

      periods.forEach(period => {
          students.forEach((student: any) => {
              let status = 'present';
              if (absentIds.has(student.id)) status = 'absent';
              else if (onDutyIds.has(student.id)) status = 'od';
              else if (medicalIds.has(student.id)) status = 'ml';
              
              attendanceData.push({
                  studentId: student.id,
                  status,
                  period
              });
          });
      });

      return academicService.saveAttendance(selectedClassId, formattedDate, attendanceData, selectedSubjectId);
    },
    onSuccess: (_, variables, context) => {
      const periodsCount = selectedLecture.startsWith('DP') ? 2 : 1;
      toast.success("Academic Sheet Synchronized", {
          description: `Logged attendance for ${periodsCount} sessions across ${students.length} students.`
      });
      setIsConfirmOpen(false);
      setAbsentIds(new Set());
      setOnDutyIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: async (err: any) => {
        const records = students.map((s: any) => {
          let st: "PRESENT" | "ABSENT" | "OD" | "ML" = "PRESENT";
          if (absentIds.has(s.id)) st = "ABSENT";
          else if (onDutyIds.has(s.id)) st = "OD";
          else if (medicalIds.has(s.id)) st = "ML";
          return { student_id: s.id, status: st };
        });
        const periodNum = parseInt(selectedLecture.replace(/[^\d]/g, '') || '1', 10);
        const draft = await offlineService.saveDraft({
            classId: selectedClassId,
            subjectId: selectedSubjectId,
            period: periodNum,
            lectureType: selectedLecture.startsWith('DP') ? 'Double Period' : 'Theory',
            date: format(date, "yyyy-MM-dd"),
            clientVersion: 1,
            records
        });

        if (draft) {
             toast.warning("Institutional Offline Mode", {
                description: "Cloud unreachable. Session securely buffered in local vault.",
                icon: <WifiOff className="w-5 h-5" />
            });
            setIsConfirmOpen(false);
            setAbsentIds(new Set());
            setOnDutyIds(new Set());
        } else {
            toast.error("Cloud Synchronization Failed", {
                description: err.message || "Database cluster unreachable. Check connectivity."
            });
        }
    }
  });

  useEffect(() => {
    if (selectedClassId) {
        const draft = localStorage.getItem(`draft_${selectedClassId}_${selectedLecture}`);
        if (draft) {
            const { absent, od } = JSON.parse(draft);
            setAbsentIds(new Set(absent));
            setOnDutyIds(new Set(od));
            toast.info("Draft Recovered", { description: "Resuming your previous roll call session." });
        }
    }
  }, [selectedClassId, selectedLecture]);


  const loading = classesLoading || studentsLoading || subjectsLoading;
  const isClaiming = claimMutation.isPending;
  const isSaving = saveMutation.isPending;
  const handleClaim = () => claimMutation.mutate();
  const handleSave = () => saveMutation.mutate();

  const filteredStudents = useMemo(() => {
    return students.filter((s: any) => {
      const matchesSearch = fuzzySearch(search, `${s.name} ${s.roll_number}`);
      const matchesSection = selectedSection === "all" || s.section === selectedSection;
      const matchesBatch = selectedBatch === "all" || s.batch === selectedBatch;
      return matchesSearch && matchesSection && matchesBatch;
    });
  }, [search, selectedSection, selectedBatch, students]);

  const filteredSubjects = useMemo(() => {
    if (!userProfile || !subjects.length) return [];
    if (userProfile.role === 'ADMIN') return subjects;
    
    const currentClass = classes.find((c: any) => c.id === selectedClassId);
    const claimedSubjectIds = currentClass?.class_claims
        ?.filter((cl: any) => cl.teacher_id === userProfile.id)
        .map((cl: any) => cl.subject_id) || [];
        
    if (claimedSubjectIds.length > 0) {
        return subjects.filter(s => claimedSubjectIds.includes(s.id));
    }
    
    // If teacher but no claims yet, show all so they can claim. 
    // If admin, show all (handled above).
    return subjects;
  }, [subjects, userProfile, selectedClassId, classes]);

  useEffect(() => {
    if (filteredSubjects.length === 1 && !selectedSubjectId) {
      setSelectedSubjectId(filteredSubjects[0].id);
    }
  }, [filteredSubjects, selectedSubjectId]);

  if (!userProfile) return null; // Let the layout handle unauthenticated/unverified state

  const toggleAttendance = (id: string, type: 'present' | 'absent' | 'od') => {
    haptics.light();
    if (type === 'present') {
      setAbsentIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      setOnDutyIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      setMedicalIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else if (type === 'absent') {
      setAbsentIds(prev => { const n = new Set(prev); n.add(id); return n; });
      setOnDutyIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      setMedicalIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      setOnDutyIds(prev => { const n = new Set(prev); n.add(id); return n; });
      setAbsentIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      setMedicalIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  const setMedical = (id: string) => {
    setMedicalIds(prev => { const n = new Set(prev); n.add(id); return n; });
    setAbsentIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    setOnDutyIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const markAllPresent = () => {
    const newAbsent = new Set(absentIds);
    const newOD = new Set(onDutyIds);
    filteredStudents.forEach(s => {
      newAbsent.delete(s.id);
      newOD.delete(s.id);
    });
    setAbsentIds(newAbsent);
    setOnDutyIds(newOD);
    toast.success(`Marked ${filteredStudents.length} students as present`);
  };



  const stats = {
    present: students.length - absentIds.size - onDutyIds.size,
    absent: absentIds.size,
    od: onDutyIds.size
  };

  return (
    <>
      <PageTransition>
        <div className="flex flex-col min-h-screen bg-slate-50/50">
          <Header
            title={
              <div className="flex items-center gap-2">
                <span className="text-slate-900 font-bold text-lg md:text-xl tracking-tight">Attendance</span>
                {selectedClassId && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-slate-300 mx-1" />
                    <span className="text-slate-500 text-xs md:text-sm font-bold truncate max-w-[120px]">
                      {classes.find(c => c.id === selectedClassId)?.name}
                    </span>
                  </>
                )}
              </div>
            }
          />

          <div className="flex-1 flex flex-col pb-32">
            {/* Mobile Filter Toggle */}
            <div className="md:hidden mt-4 mb-2">
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="w-full h-12 rounded-2xl border-slate-200 bg-white shadow-sm font-black uppercase tracking-widest text-[10px] gap-2"
              >
                {showFilters ? "Hide Selection" : "Refine Selection"}
                <Search className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
              </Button>
            </div>

            {/* Academic Filters Section */}
            <div className={cn(
              "bg-white border border-slate-200 rounded-[2rem] p-5 md:p-6 mb-6 shadow-sm transition-all duration-300 overflow-hidden",
              !showFilters && "hidden md:block"
            )}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Class</label>
                  <Select value={selectedClassId} onValueChange={(val) => val && setSelectedClassId(val)}>
                    <SelectTrigger className="w-full h-12 border-slate-200 bg-slate-50/50 hover:bg-white transition-colors shadow-sm font-bold rounded-2xl text-slate-700">
                      <SelectValue>
                        {filteredClasses.find(c => c.id === selectedClassId)?.name || "Select Class"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200">
                      {filteredClasses.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name} {cls.section}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 lg:contents gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Batch</label>
                    <Select value={selectedBatch} onValueChange={(val) => val && setSelectedBatch(val)}>
                      <SelectTrigger className="w-full h-12 border-slate-200 bg-slate-50/50 hover:bg-white transition-colors shadow-sm font-bold rounded-2xl text-slate-700">
                        <SelectValue placeholder="Batch" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200">
                        <SelectItem value="all">All Batches</SelectItem>
                        <SelectItem value="A">Batch A</SelectItem>
                        <SelectItem value="B">Batch B</SelectItem>
                        <SelectItem value="C">Batch C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lecture</label>
                    <Select value={selectedLecture} onValueChange={(val) => val && setSelectedLecture(val)}>
                      <SelectTrigger className="w-full h-12 border-slate-200 bg-slate-50/50 hover:bg-white transition-colors shadow-sm font-bold rounded-2xl text-slate-700">
                        <SelectValue placeholder="Lecture" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-slate-200">
                        <SelectItem value="L1">L1</SelectItem>
                        <SelectItem value="L2">L2</SelectItem>
                        <SelectItem value="L3">L3</SelectItem>
                        <SelectItem value="DP1">L1+L2</SelectItem>
                        <SelectItem value="DP2">L3+L4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mapped Subject</label>
                  <Select value={selectedSubjectId} onValueChange={(val) => val && setSelectedSubjectId(val)}>
                    <SelectTrigger className="w-full h-12 border-slate-200 bg-slate-50/50 hover:bg-white transition-colors shadow-sm font-bold rounded-2xl text-slate-700">
                      <SelectValue>
                        <span className="truncate">{filteredSubjects.find(s => s.id === selectedSubjectId)?.name || "Select Subject"}</span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200">
                      {filteredSubjects.length > 0 ? (
                        filteredSubjects.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                        ))
                      ) : (
                        <div className="p-3 text-xs font-bold text-slate-400">No subjects claimed yet</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Attendance Date</label>
                  <Popover>
                    <PopoverTrigger
                      className={cn("h-12 border border-slate-200 bg-slate-50/50 hover:bg-white shadow-sm font-bold rounded-2xl text-left px-4 w-full text-slate-800 transition-all flex items-center")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                      <span className="truncate">{date ? format(date, "MMM d, yyyy") : "Select Date"}</span>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-[2rem] overflow-hidden shadow-2xl border-slate-200" align="end">
                      <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {selectedSubjectId && !currentAssignment && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                  <Button 
                      variant="outline" 
                      className="h-12 px-6 rounded-2xl border-blue-200 bg-blue-50 text-blue-700 font-black uppercase tracking-widest hover:bg-blue-100 transition-all gap-2 shadow-sm text-xs"
                      onClick={handleClaim}
                      disabled={isClaiming}
                  >
                      <UserCheck className="w-5 h-5" />
                      Claim Subject
                  </Button>
                </div>
              )}
            </div>

            {/* Master Control Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 md:mb-8">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    placeholder="Search student list..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 h-12 md:h-14 w-full border-slate-200 bg-white shadow-lg shadow-slate-200/20 rounded-2xl md:rounded-[1.25rem] focus-visible:ring-blue-500 font-bold text-slate-700"
                  />
                </div>
                <Button 
                  variant="outline"
                  onClick={markAllPresent}
                  className="h-12 md:h-14 px-5 rounded-2xl md:rounded-[1.25rem] border-emerald-100 bg-emerald-50 text-emerald-700 font-black uppercase tracking-widest hover:bg-emerald-100 transition-all gap-2 hidden md:flex shadow-sm"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  All Present
                </Button>
              </div>

              <div className="hidden lg:flex items-center justify-end gap-6">
                <div className="text-right">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll Call Summary</div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-black text-slate-700">{stats.present} P</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-xs font-black text-red-600">{stats.absent} A</span>
                    </div>
                  </div>
                </div>
                
                <div className="hidden sm:block">
                  <AttendanceSyncDialog 
                    isOpen={isConfirmOpen}
                    onOpenChange={setIsConfirmOpen}
                    onSync={handleSave}
                    isSaving={isSaving}
                    stats={stats}
                    lecture={selectedLecture}
                    date={date}
                    sampleAbsentRoll={students.find(s => absentIds.has(s.id))?.roll_number}
                  />
                </div>
              </div>
            </div>

            <Card className="flex-1 rounded-[2rem] overflow-hidden bg-white border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col relative min-h-[400px]">
              <div className="p-4 md:p-6 border-b border-slate-100 bg-white flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] md:text-sm font-black text-slate-900 uppercase tracking-widest">Marking Mode</h4>
                    <p className="hidden md:block text-xs text-slate-500 mt-1">Touch-optimized for rapid entry</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setEntryMode('list')}
                      className={cn("px-4 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wider transition-all", entryMode === 'list' ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600")}
                    >List View</button>
                    <button
                      onClick={() => setEntryMode('grid')}
                      className={cn("px-4 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wider transition-all", entryMode === 'grid' ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600")}
                    >Grid View</button>
                  </div>
                </div>

                {entryMode === 'list' ? (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter absent roll numbers (e.g. 001, 005 or 001 005)..."
                      className="flex-1 bg-white h-11 md:h-12 text-sm rounded-xl border-slate-200 font-medium px-4 shadow-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value;
                          if (!val.trim()) return;
                          
                          // Handle both commas and spaces as separators
                          const rolls = val.split(/[,\s]+/).map(r => r.trim().toLowerCase()).filter(Boolean);
                          const newAbsent = new Set(absentIds);
                          let matchedCount = 0;

                          students.forEach(s => {
                            const rollNum = (s.roll_number || s.rollNumber || "").toLowerCase();
                            if (!rollNum) return;
                            const simpleRoll = rollNum.slice(-3); // Last 3 digits
                            
                            if (rolls.includes(rollNum) || rolls.includes(simpleRoll)) {
                              newAbsent.add(s.id);
                              matchedCount++;
                            }
                          });

                          setAbsentIds(newAbsent);
                          (e.target as HTMLInputElement).value = '';
                          if (matchedCount > 0) {
                            toast.success(`Marked ${matchedCount} students absent`);
                          } else {
                            toast.error("No matching roll numbers found");
                          }
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 animate-in fade-in zoom-in-95 duration-300">
                    {students.slice(0, 12).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => toggleAttendance(s.id, absentIds.has(s.id) ? 'present' : 'absent')}
                        className={cn(
                          "h-10 px-3 rounded-lg text-[10px] font-bold border transition-all active:scale-95",
                          absentIds.has(s.id) ? "bg-red-500 text-white border-red-600" : "bg-white text-slate-800 border-slate-200"
                        )}
                      >
                        {s.roll_number?.slice(-4)}
                      </button>
                    ))}
                    {students.length > 12 && <span className="text-[10px] text-slate-400 flex items-center px-2">+{students.length - 12} more</span>}
                  </div>
                )}
              </div>

              <div className="bg-slate-50/95 backdrop-blur-sm px-3 md:px-6 py-3 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <div className="flex-1">Institutional Roster</div>
                <div className="w-[150px] md:w-[180px] text-center">Action</div>
              </div>

              <div className="flex-1 overflow-visible">
                <StudentList 
                  students={filteredStudents}
                  absentIds={absentIds}
                  onDutyIds={onDutyIds}
                  medicalIds={medicalIds}
                  onToggle={toggleAttendance}
                  onMedical={setMedical}
                  loading={loading}
                />
              </div>
            </Card>
          </div>

          <StudentProfile
            student={selectedStudent}
            onClose={() => setIsProfileOpen(false)}
          />
        </div>
      </PageTransition>

      {/* Floating Action Bar (Mobile Only) - Moved outside PageTransition to fix viewport anchoring */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-[420px] h-16 px-5 rounded-full bg-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[100] flex md:hidden items-center justify-between gap-4 border border-white/20 backdrop-blur-md">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white font-black text-xs border border-white/10 shadow-inner">
            {absentIds.size}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none opacity-80">Absentees</span>
            <span className="text-xs font-black text-white leading-none mt-1.5">
              {absentIds.size} <span className="text-white/30 ml-0.5">Total</span>
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-white/10 mx-1" />

        <div className="flex-1 flex justify-end">
          <AttendanceSyncDialog
            isOpen={isConfirmOpen}
            onOpenChange={setIsConfirmOpen}
            onSync={handleSave}
            isSaving={isSaving}
            stats={stats}
            lecture={selectedLecture || 'Subject'}
            date={date}
            sampleAbsentRoll={students.find(s => absentIds.has(s.id))?.roll_number}
            triggerClassName="h-11 px-6 rounded-full bg-white text-slate-900 hover:bg-slate-50 text-[11px] font-black shadow-xl border-none shrink-0 active:scale-95 transition-all"
          />
        </div>
      </div>
    </>
  );
}

function Badge({ children, variant = "default", className, ...props }: any) {
  return <span className={cn("inline-flex items-center justify-center", className)} {...props}>{children}</span>;
}
