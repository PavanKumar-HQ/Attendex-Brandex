import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const registryService = {
  // --- Classes ---
  async getClasses() {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name', { ascending: true });
      
      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },

  async claimClass(classId: string, subjectId: string) {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('teacher_subject_assignments')
      .insert({
        teacher_id: user.id,
        class_id: classId,
        subject_id: subjectId
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') throw new Error("Subject already assigned for this class");
      throw error;
    }
    return data;
  },

  async createClass(cls: { name: string; section?: string; year: number; semester?: number; department: string; teacher_id?: string }) {
    if (!isSupabaseConfigured) {
      throw new Error("Database connection not configured");
    }

    const { data, error } = await supabase
      .from('classes')
      .insert([cls])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getSubjects(filter?: { department?: string; semester?: number }) {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      let query = supabase.from('subjects').select('*');
      if (filter?.department) query = query.eq('department', filter.department);
      if (filter?.semester) query = query.eq('semester', filter.semester);
      
      const { data, error } = await query.order('name', { ascending: true });
      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },

  // --- Students ---
  async getAllStudents(page = 0, pageSize = 50) {
    if (!isSupabaseConfigured) {
      return { data: [], count: 0 };
    }

    try {
      const from = page * pageSize;
      const to   = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from('students')
        .select('*, classes(name)', { count: 'exact' })
        .order('name', { ascending: true })
        .range(from, to);

      if (error || !data) return { data: [], count: 0 };
      return { data: data || [], count: count || 0 };
    } catch {
      return { data: [], count: 0 };
    }
  },

  async getAllStudentsUnpaginated() {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*, classes(name)')
        .order('name', { ascending: true });
      if (error || !data) return [];
      return data;
    } catch {
      return [];
    }
  },

  async getStudentsByClass(classId: string, subjectId?: string) {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('roll_number', { ascending: true });
      
      if (error || !students) return [];
      return students;
    } catch {
      return [];
    }
  },

  async getStudentsByClassWithMarks(classId: string, subjectId: string) {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const { data: students, error } = await supabase
        .from('students')
        .select('*, marks(*)')
        .eq('class_id', classId)
        .order('roll_number', { ascending: true });
      
      if (error || !students) return [];
      return students;
    } catch {
      return [];
    }
  },

  async addStudent(student: any) {
    if (!isSupabaseConfigured) {
      throw new Error("Database connection not configured");
    }

    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStudent(id: string, updates: any) {
    if (!isSupabaseConfigured) {
      throw new Error("Database connection not configured");
    }

    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteStudent(id: string) {
    if (!isSupabaseConfigured) {
      throw new Error("Database connection not configured");
    }

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async deleteStudentsByClass(classId: string) {
    if (!isSupabaseConfigured) {
      throw new Error("Database connection not configured");
    }

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('class_id', classId);

    if (error) throw error;
    return true;
  },

  async importStudents(students: any[]) {
    if (!isSupabaseConfigured) {
      throw new Error("Database connection not configured");
    }

    const { data, error } = await supabase
      .from('students')
      .insert(students)
      .select('*');

    if (error) throw error;
    return data;
  },

  async updateStudentMarks(studentId: string, subjectId: string, marks: any) {
    if (!isSupabaseConfigured) {
      throw new Error("Database connection not configured");
    }

    const { data, error } = await supabase
      .from('marks')
      .upsert({
        student_id: studentId,
        subject_id: subjectId,
        marks_obtained: typeof marks === 'number' ? marks : marks.final_marks || marks.cia_total || 0,
        metadata: typeof marks === 'object' ? marks : {},
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_id,subject_id' });

    if (error) throw error;
    return data;
  }
};
