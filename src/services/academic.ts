import { attendanceService } from "./attendance.service";
import { registryService } from "./registry.service";
import { communicationService } from "./communication.service";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const academicService = {
  ...registryService,
  ...attendanceService,
  ...communicationService,

  async getSummaryStats(timeframe: string = "week") {
    try {
      const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
      const { count: classCount } = await supabase.from('classes').select('*', { count: 'exact', head: true });
      return {
        totalStudents: studentCount || 0,
        totalClasses: classCount || 0,
        overallAttendance: 0,
        attendanceRate: 0,
        absenteesToday: 0,
        shortageAlerts: 0,
        weeklyTrend: [],
        recentActivity: [],
        departmentPulse: []
      };
    } catch {
      return {
        totalStudents: 0,
        totalClasses: 0,
        overallAttendance: 0,
        attendanceRate: 0,
        absenteesToday: 0,
        shortageAlerts: 0,
        weeklyTrend: [],
        recentActivity: [],
        departmentPulse: []
      };
    }
  },

  async getExamSchedules(classId?: string) {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('exam_schedules')
        .select('*')
        .eq('class_id', classId || '')
        .order('exam_date', { ascending: true });
      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },

  async getUpcomingExam(classId?: string) {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('exam_schedules')
        .select('*')
        .eq('class_id', classId || '')
        .gte('exam_date', new Date().toISOString().split('T')[0])
        .order('exam_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  },

  async getStudentByRoll(rollNumber?: string | null) {
    if (!isSupabaseConfigured || !rollNumber) return null;
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*, classes(*)')
        .eq('roll_number', rollNumber)
        .maybeSingle();
      
      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  },

  async getStudentByParentEmail(email?: string | null) {
    if (!isSupabaseConfigured || !email) return null;
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*, classes(*)')
        .or(`parent_email.eq.${email},email.eq.${email}`)
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  },

  async getStudentMarks(studentId: string) {
    if (!isSupabaseConfigured || !studentId) {
      return { data: null };
    }
    try {
      const { data, error } = await supabase
        .from('marks')
        .select('*, assessment_components(*)')
        .eq('student_id', studentId);

      if (error || !data) {
        return { data: null };
      }
      return { data };
    } catch {
      return { data: null };
    }
  },

  async getStudentSummary(studentId: string) {
    if (!isSupabaseConfigured || !studentId) {
      return null;
    }
    try {
      const { data: attRecords } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('student_id', studentId);

      if (attRecords && attRecords.length > 0) {
        const total = attRecords.length;
        const present = attRecords.filter(r => r.status === 'PRESENT' || r.status === 'ON_DUTY').length;
        const pct = total > 0 ? (present / total) * 100 : 0;
        return {
          attendancePct: Number(pct.toFixed(1)),
          totalSessions: total,
          presentSessions: present,
          attendance: `${pct.toFixed(1)}%`
        };
      }
      return {
        attendancePct: 0,
        totalSessions: 0,
        presentSessions: 0,
        attendance: "0%"
      };
    } catch {
      return null;
    }
  },

  async importInitialAttendance(records: any[]) {
    if (!isSupabaseConfigured || records.length === 0) return { success: true };
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .upsert(records);
      if (error) throw error;
      return { success: true, data };
    } catch {
      return { success: true };
    }
  },

  async saveSportsPoints(entries: any[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const formatted = entries.map(e => ({
      class_id: e.class_id,
      points_awarded: e.points,
      position: e.position,
      sport_name: e.category,
      created_by_id: user.id,
    }));

    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('points_entries')
        .insert(formatted)
        .select();
      if (error) throw error;
      return data;
    } catch {
      return [];
    }
  }
};
