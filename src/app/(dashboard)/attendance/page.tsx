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
import { 
  UserCheck, 
  WifiOff, 
  CheckCircle2, 
  CalendarIcon, 
  Search, 
  Users, 
  UserX, 
  Activity, 
  Sparkles, 
  LayoutList, 
  LayoutGrid, 
  Send, 
  RotateCcw,
  Zap,
  BookOpen,
  Layers,
  GraduationCap,
  ShieldCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { offlineService } from "@/services/offline";
import { haptics } from "@/lib/haptics";
import { toast } from "sonner";
import { cn, fuzzySearch } from "@/lib/utils";
import { subjectService } from "@/services/subjects";
import { supabase } from "@/lib/supabase";
import { StudentList } from "@/components/attendance/student-list";
import { AttendanceSyncDialog } from "@/components/attendance/sync-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStudents, useClasses } from "@/hooks/use-academic";
import { academicService } from "@/services/academic";

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
  const [fastInput, setFastInput] = useState("");
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const queryClient = useQueryClient();
  const router = useRouter();

  // Queries
  const { data: classes = [], isLoading: classesLoading, refetch: refetchClasses } = useClasses();
  const { data: students = [], isLoading: studentsLoading, refetch: refetchStudents } = useStudents(selectedClassId, selectedSubjectId);

  const [userProfile, setUserProfile] = useState<any>({ role: 'TEACHER', full_name: 'Faculty Member' });
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
    if (!userProfile || userProfile.role === 'ADMIN' || userProfile.role === 'SUPER_ADMIN' || userProfile.role === 'PRINCIPAL') return classes;
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

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', selectedClassId],
    queryFn: () => subjectService.getAssignmentsForClass(selectedClassId),
    enabled: !!selectedClassId,
  });

  const currentAssignment = useMemo(() => {
    return assignments.find((a: any) => a.subject_id === selectedSubjectId) || null;
  }, [assignments, selectedSubjectId]);

  const filteredSubjects = useMemo(() => {
    if (!userProfile || !subjects.length) return [];
    if (userProfile.role === 'ADMIN' || userProfile.role === 'PRINCIPAL') return subjects;
    
    const currentClass = classes.find((c: any) => c.id === selectedClassId);
    const claimedSubjectIds = currentClass?.class_claims
      ?.filter((cl: any) => cl.teacher_id === userProfile.id)
      .map((cl: any) => cl.subject_id) || [];
        
    if (claimedSubjectIds.length > 0) {
      return subjects.filter(s => claimedSubjectIds.includes(s.id));
    }
    return subjects;
  }, [subjects, userProfile, selectedClassId, classes]);

  useEffect(() => {
    if (filteredSubjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(filteredSubjects[0].id);
    }
  }, [filteredSubjects, selectedSubjectId]);

  const claimMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");
      return subjectService.claimSubject(selectedSubjectId, selectedClassId, user.id);
    },
    onSuccess: () => {
      toast.success("Subject Claimed Successfully", { description: "You are registered as the primary faculty for this course." });
      queryClient.invalidateQueries({ queryKey: ['assignments', selectedClassId] });
    },
    onError: (err: any) => toast.error("Claim Failed", { description: err.message }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const periods = selectedLecture.startsWith('DP') 
        ? (selectedLecture === 'DP1' ? [1, 2] : [3, 4])
        : [parseInt(selectedLecture.replace('L', '')) || 1];

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
    onSuccess: () => {
      const periodsCount = selectedLecture.startsWith('DP') ? 2 : 1;
      toast.success("Academic Roll-Call Finalized", {
        description: `Recorded attendance for ${periodsCount} period(s) across ${students.length} students.`
      });
      setIsConfirmOpen(false);
      setAbsentIds(new Set());
      setOnDutyIds(new Set());
      setMedicalIds(new Set());
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
        toast.warning("Offline Buffer Saved", {
          description: "Session buffered in browser vault. Will auto-sync when connection restores.",
          icon: <WifiOff className="w-5 h-5" />
        });
        setIsConfirmOpen(false);
      } else {
        toast.error("Sync Error", { description: err.message || "Failed to log attendance." });
      }
    }
  });

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
    setAbsentIds(new Set());
    setOnDutyIds(new Set());
    setMedicalIds(new Set());
    toast.success(`Marked all ${students.length} students as Present`);
  };

  const handleFastAbsentSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!fastInput.trim()) return;

      const tokens = fastInput.split(/[,\s]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
      const newAbsent = new Set(absentIds);
      let matched = 0;

      students.forEach(s => {
        const roll = (s.roll_number || s.rollNumber || "").toLowerCase();
        const shortRoll = roll.slice(-3); // e.g. '042'
        if (tokens.some(t => roll.includes(t) || shortRoll === t || s.name.toLowerCase().includes(t))) {
          newAbsent.add(s.id);
          matched++;
        }
      });

      setAbsentIds(newAbsent);
      setFastInput("");
      if (matched > 0) {
        toast.success(`Marked ${matched} student(s) absent via rapid scanner`);
      } else {
        toast.error("No student matched the entered roll numbers");
      }
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s: any) => {
      const matchesSearch = fuzzySearch(search, `${s.name} ${s.roll_number || s.rollNumber}`);
      const matchesSection = selectedSection === "all" || s.section === selectedSection;
      const matchesBatch = selectedBatch === "all" || s.batch === selectedBatch;
      return matchesSearch && matchesSection && matchesBatch;
    });
  }, [search, selectedSection, selectedBatch, students]);

  const presentCount = students.length - absentIds.size - onDutyIds.size - medicalIds.size;
  const absentCount = absentIds.size;
  const odCount = onDutyIds.size + medicalIds.size;
  const attendanceRate = students.length > 0 
    ? Math.round((presentCount / students.length) * 100) 
    : 100;

  const currentClassName = classes.find(c => c.id === selectedClassId)?.name || "Select Class";
  const currentSubjectName = filteredSubjects.find(s => s.id === selectedSubjectId)?.name || "Select Subject";

  return (
    <PageTransition>
      <div className="space-y-6">
        <Header 
          title={
            <div className="flex items-center gap-2">
              <span>Classroom Roll-Call Execution</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {currentClassName}
              </span>
            </div>
          } 
        />

        {/* 1. Executive Filter Toolbar */}
        <Card className="p-4 md:p-5 bg-white border-slate-200/90 shadow-sm rounded-xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {/* Class Selector */}
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-blue-600" />
                <span>Academic Cohort</span>
              </label>
              <Select value={selectedClassId} onValueChange={(val) => val && setSelectedClassId(val)}>
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-slate-800 font-semibold text-xs focus:ring-slate-900">
                  <SelectValue placeholder="Select Class">
                    {currentClassName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  {filteredClasses.map(cls => (
                    <SelectItem key={cls.id} value={cls.id} className="text-xs font-medium">
                      {cls.name} ({cls.section || 'Sec A'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Batch Selector */}
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-600" />
                <span>Batch Division</span>
              </label>
              <Select value={selectedBatch} onValueChange={(val) => val && setSelectedBatch(val)}>
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-slate-800 font-semibold text-xs focus:ring-slate-900">
                  <SelectValue placeholder="Batch" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  <SelectItem value="all" className="text-xs">All Batches (Full Cohort)</SelectItem>
                  <SelectItem value="A" className="text-xs">Batch A (Roll 1-30)</SelectItem>
                  <SelectItem value="B" className="text-xs">Batch B (Roll 31-60)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lecture / Period */}
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-600" />
                <span>Lecture Slot</span>
              </label>
              <Select value={selectedLecture} onValueChange={(val) => val && setSelectedLecture(val)}>
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-slate-800 font-semibold text-xs focus:ring-slate-900">
                  <SelectValue placeholder="Lecture" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  <SelectItem value="L1" className="text-xs">Period 1 (09:00 - 10:00 AM)</SelectItem>
                  <SelectItem value="L2" className="text-xs">Period 2 (10:00 - 11:00 AM)</SelectItem>
                  <SelectItem value="L3" className="text-xs">Period 3 (11:15 - 12:15 PM)</SelectItem>
                  <SelectItem value="DP1" className="text-xs">Lab Block (Period 1 + 2)</SelectItem>
                  <SelectItem value="DP2" className="text-xs">Lab Block (Period 3 + 4)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-emerald-600" />
                <span>Mapped Subject</span>
              </label>
              <Select value={selectedSubjectId} onValueChange={(val) => val && setSelectedSubjectId(val)}>
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-slate-50 text-slate-800 font-semibold text-xs focus:ring-slate-900">
                  <SelectValue>
                    <span className="truncate">{currentSubjectName}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  {filteredSubjects.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <CalendarIcon className="w-3 h-3 text-purple-600" />
                <span>Session Date</span>
              </label>
              <Popover>
                <PopoverTrigger
                  className="h-10 border border-slate-200 bg-slate-50 hover:bg-white text-slate-800 font-semibold rounded-lg px-3 w-full text-xs flex items-center justify-between transition-all"
                >
                  <span className="truncate">{date ? format(date, "MMM d, yyyy") : "Today"}</span>
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border-slate-200" align="end">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </Card>

        {/* 2. Roll-Call Live KPI HUD */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white border-slate-200/90 shadow-sm rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px]">Roster Enrolled</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">{students.length}</h3>
            <p className="text-[11px] text-slate-500 font-medium">Verified Active Profiles</p>
          </Card>

          <Card className="p-4 bg-emerald-50/60 border-emerald-200/80 shadow-sm rounded-xl space-y-1">
            <div className="flex items-center justify-between text-emerald-800 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px]">Present</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-extrabold text-emerald-700">{presentCount}</h3>
            <p className="text-[11px] text-emerald-600 font-medium">In Lecture Hall</p>
          </Card>

          <Card className="p-4 bg-rose-50/60 border-rose-200/80 shadow-sm rounded-xl space-y-1">
            <div className="flex items-center justify-between text-rose-800 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px]">Absentees</span>
              <UserX className="w-4 h-4 text-rose-600" />
            </div>
            <h3 className="text-2xl font-extrabold text-rose-700">{absentCount}</h3>
            <p className="text-[11px] text-rose-600 font-medium">Parent SMS Alert Ready</p>
          </Card>

          <Card className="p-4 bg-slate-900 text-white border-slate-800 shadow-sm rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px]">Session Rate</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-2xl font-extrabold text-white">{attendanceRate}%</h3>
            <p className="text-[11px] text-emerald-400 font-medium">
              {attendanceRate >= 85 ? "✓ Optimal Cohort Standing" : "⚠ Defaulter Threshold"}
            </p>
          </Card>
        </div>

        {/* 3. Main Roster Table & Marking Command Console */}
        <Card className="bg-white border-slate-200/90 shadow-sm rounded-xl overflow-hidden">
          {/* Top Action Console */}
          <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by student name or roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-9 bg-white border-slate-200 text-xs font-medium rounded-lg"
              />
            </div>

            {/* Fast Absent Scanner Input */}
            <div className="relative w-full md:w-72">
              <Zap className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
              <Input
                placeholder="Type absent roll (e.g. 01, 04, 12) + Enter"
                value={fastInput}
                onChange={(e) => setFastInput(e.target.value)}
                onKeyDown={handleFastAbsentSubmit}
                className="h-10 pl-9 bg-white border-slate-200 text-xs font-medium rounded-lg placeholder:text-slate-400 focus-visible:ring-amber-500"
              />
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllPresent}
                className="h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 font-bold text-xs rounded-lg px-3.5 flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>All Present</span>
              </Button>

              <div className="flex items-center p-1 bg-slate-200/80 rounded-lg">
                <button
                  type="button"
                  onClick={() => setEntryMode('list')}
                  className={cn("p-1.5 rounded-md transition-all", entryMode === 'list' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}
                  title="List View"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('grid')}
                  className={cn("p-1.5 rounded-md transition-all", entryMode === 'grid' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>

              <Button
                size="sm"
                onClick={() => setIsConfirmOpen(true)}
                disabled={saveMutation.isPending || students.length === 0}
                className="h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg px-4 flex items-center gap-2 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Finalize & Sync</span>
              </Button>
            </div>
          </div>

          {/* Absent Tags Banner if any absentees marked */}
          {absentIds.size > 0 && (
            <div className="px-5 py-2.5 bg-rose-50 border-b border-rose-100 flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-rose-800 text-[11px] uppercase tracking-wider">Marked Absent:</span>
              {Array.from(absentIds).map(id => {
                const s = students.find((st: any) => st.id === id);
                return (
                  <span
                    key={id}
                    onClick={() => toggleAttendance(id, 'present')}
                    className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-800 font-mono text-[11px] font-bold border border-rose-200 transition-colors"
                    title="Click to toggle Present"
                  >
                    {s?.roll_number || s?.rollNumber || "ID"} ×
                  </span>
                );
              })}
            </div>
          )}

          {/* Roster Header */}
          <div className="bg-slate-50 px-5 py-2.5 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            <span>Student Identity & Standing ({filteredStudents.length})</span>
            <span>Attendance Status (P / A / OD / ML)</span>
          </div>

          {/* View Modes */}
          {entryMode === 'list' ? (
            <StudentList
              students={filteredStudents}
              absentIds={absentIds}
              onDutyIds={onDutyIds}
              medicalIds={medicalIds}
              onToggle={toggleAttendance}
              onMedical={setMedical}
              loading={studentsLoading}
            />
          ) : (
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredStudents.map((s: any) => {
                const isAbsent = absentIds.has(s.id);
                const isOD = onDutyIds.has(s.id);
                const isMedical = medicalIds.has(s.id);
                const isPresent = !isAbsent && !isOD && !isMedical;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleAttendance(s.id, isAbsent ? 'present' : 'absent')}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all space-y-1.5 flex flex-col justify-between h-28 shadow-xs",
                      isAbsent
                        ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500/20"
                        : isOD
                        ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20"
                        : isMedical
                        ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500/20"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {s.roll_number?.slice(-3) || "001"}
                      </span>
                      <span className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white",
                        isAbsent ? "bg-rose-600" : isOD ? "bg-blue-600" : isMedical ? "bg-amber-500" : "bg-emerald-600"
                      )}>
                        {isAbsent ? "A" : isOD ? "OD" : isMedical ? "ML" : "P"}
                      </span>
                    </div>

                    <div>
                      <p className="font-bold text-xs text-slate-900 truncate leading-tight">{s.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{s.attendance ?? 90}% Standing</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Confirmation Modal */}
        <AttendanceSyncDialog
          isOpen={isConfirmOpen}
          onOpenChange={setIsConfirmOpen}
          onSync={() => saveMutation.mutate()}
          isSaving={saveMutation.isPending}
          stats={{ present: presentCount, absent: absentCount, od: odCount }}
          lecture={selectedLecture}
          date={date}
          sampleAbsentRoll={students.find((s: any) => absentIds.has(s.id))?.roll_number}
        />
      </div>
    </PageTransition>
  );
}
