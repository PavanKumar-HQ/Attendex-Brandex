import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const registryService = {
  // ─── Classes ───
  async getClasses() {
    try {
      const res = await fetch("/api/classes", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase.from("classes").select("*").order("name", { ascending: true });
        if (data && data.length > 0) return data;
      } catch {
        // ignore
      }
    }
    return [];
  },

  async claimClass(classId: string, subjectId: string, teacherId?: string, teacherName?: string) {
    try {
      const res = await fetch("/api/classes/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: classId,
          subject_id: subjectId,
          teacher_id: teacherId || "faculty-current",
          teacher_name: teacherName || "Faculty Member"
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to claim class");
      return json;
    } catch (err: any) {
      throw err;
    }
  },

  async createClass(cls: { name: string; section?: string; year: number; semester?: number; department: string; teacher_id?: string }) {
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cls)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to create class");
      return json.data;
    } catch (err: any) {
      throw err;
    }
  },

  async getSubjects(filter?: { department?: string; semester?: number }) {
    try {
      const params = new URLSearchParams();
      if (filter?.department) params.set("department", filter.department);
      if (filter?.semester) params.set("semester", filter.semester.toString());
      const res = await fetch(`/api/subjects?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) return json.data;
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      try {
        let query = supabase.from("subjects").select("*");
        if (filter?.department) query = query.eq("department", filter.department);
        if (filter?.semester) query = query.eq("semester", filter.semester);
        const { data } = await query.order("name", { ascending: true });
        if (data) return data;
      } catch {
        // ignore
      }
    }
    return [];
  },

  // ─── Students ───
  async getAllStudents(page = 0, pageSize = 50) {
    try {
      const res = await fetch(`/api/students?page=${page}&pageSize=${pageSize}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        return { data: json.data || [], count: json.total || 0 };
      }
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      try {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data, count } = await supabase
          .from("students")
          .select("*, classes(name)", { count: "exact" })
          .order("name", { ascending: true })
          .range(from, to);
        if (data) return { data, count: count || 0 };
      } catch {
        // ignore
      }
    }
    return { data: [], count: 0 };
  },

  async getAllStudentsUnpaginated() {
    try {
      const res = await fetch("/api/students?pageSize=500", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) return json.data;
    } catch {
      // ignore
    }
    return [];
  },

  async getStudentsByClass(classId: string, subjectId?: string) {
    try {
      const res = await fetch(`/api/students?class_id=${classId}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) return json.data;
    } catch {
      // ignore
    }
    return [];
  },

  async getStudentsByClassWithMarks(classId: string, subjectId: string) {
    try {
      const res = await fetch(`/api/marks?class_id=${classId}&subject_id=${subjectId}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) return json.data;
    } catch {
      // ignore
    }
    return [];
  },

  async addStudent(student: any) {
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to add student");
      return json.data;
    } catch (err: any) {
      throw err;
    }
  },

  async updateStudent(id: string, updates: any) {
    try {
      const res = await fetch("/api/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update student");
      return json;
    } catch (err: any) {
      throw err;
    }
  },

  async deleteStudent(id: string) {
    try {
      const res = await fetch(`/api/students?id=${id}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete student");
      return true;
    } catch (err: any) {
      throw err;
    }
  },

  async deleteStudentsByClass(classId: string) {
    return true;
  },

  async importStudents(students: any[]) {
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(students)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to import students");
      return json;
    } catch (err: any) {
      throw err;
    }
  },

  async updateStudentMarks(studentId: string, subjectId: string, marks: any) {
    try {
      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_id: marks.class_id,
          subject_id: subjectId,
          records: [{
            student_id: studentId,
            cia1: marks.cia1,
            cia2: marks.cia2,
            test1: marks.test1,
            test2: marks.test2,
            attendancePercentage: marks.attendancePercentage
          }]
        })
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      throw err;
    }
  }
};
