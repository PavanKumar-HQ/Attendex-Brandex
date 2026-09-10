export interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  semester: number;
  year?: number;
  credits?: number;
  is_lab?: boolean;
}

export interface SubjectAssignment {
  id: string;
  subject_id: string;
  class_id: string;
  teacher_id: string;
  created_at: string;
  subjects?: Subject;
}

export const subjectService = {
  async getSubjects(filters?: { department?: string; year?: number; semester?: number }): Promise<Subject[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.department) params.set("department", filters.department);
      if (filters?.semester) params.set("semester", filters.semester.toString());
      const res = await fetch(`/api/subjects?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    } catch {
      // ignore
    }
    return [];
  },

  async createSubject(subject: Omit<Subject, "id">): Promise<Subject> {
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subject)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to create subject");
    return json.data;
  },

  async updateSubject(id: string, updates: Partial<Subject>): Promise<Subject> {
    const res = await fetch("/api/subjects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to update subject");
    return json.data;
  },

  async claimSubject(subjectId: string, classId: string, teacherId?: string, teacherName?: string) {
    const res = await fetch("/api/classes/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject_id: subjectId,
        class_id: classId,
        teacher_id: teacherId || "faculty-current",
        teacher_name: teacherName || "Faculty Member"
      })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to claim subject");
    return json;
  },

  async getAssignmentsForClass(classId: string) {
    try {
      const res = await fetch(`/api/classes`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const found = json.data.find((c: any) => c.id === classId);
        return found?.claims || [];
      }
    } catch {
      // ignore
    }
    return [];
  },

  async getAssignmentsByTeacher(teacherId: string) {
    try {
      const res = await fetch(`/api/classes`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const claims: any[] = [];
        for (const cls of json.data) {
          for (const cl of cls.claims || []) {
            if (!teacherId || cl.teacher_id === teacherId || cl.teacher_id === "faculty-current") {
              claims.push({ ...cl, class: cls });
            }
          }
        }
        return claims;
      }
    } catch {
      // ignore
    }
    return [];
  }
};
