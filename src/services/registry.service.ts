import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const DEMO_CLASSES = [
  {
    id: "cls-1",
    name: "B.Tech Computer Science",
    section: "4A",
    year: 4,
    semester: 8,
    department: "Computer Science",
    student_count: 62,
    class_claims: [{ id: "cc-1", subject_id: "sub-1", subjects: { id: "sub-1", name: "Distributed Systems", code: "CS801" } }]
  },
  {
    id: "cls-2",
    name: "B.Tech Artificial Intelligence",
    section: "3B",
    year: 3,
    semester: 6,
    department: "Computer Science",
    student_count: 58,
    class_claims: [{ id: "cc-2", subject_id: "sub-2", subjects: { id: "sub-2", name: "Deep Learning & NLP", code: "AI602" } }]
  },
  {
    id: "cls-3",
    name: "B.Tech Electronics & Comm",
    section: "4B",
    year: 4,
    semester: 8,
    department: "Electronics",
    student_count: 64,
    class_claims: [{ id: "cc-3", subject_id: "sub-3", subjects: { id: "sub-3", name: "VLSI Design", code: "EC801" } }]
  },
  {
    id: "cls-4",
    name: "B.Tech Information Technology",
    section: "2A",
    year: 2,
    semester: 4,
    department: "Information Technology",
    student_count: 60,
    class_claims: [{ id: "cc-4", subject_id: "sub-4", subjects: { id: "sub-4", name: "Database Systems", code: "IT401" } }]
  },
  {
    id: "cls-5",
    name: "B.Tech Mechanical Engineering",
    section: "3A",
    year: 3,
    semester: 6,
    department: "Mechanical",
    student_count: 54,
    class_claims: [{ id: "cc-5", subject_id: "sub-5", subjects: { id: "sub-5", name: "Heat Transfer", code: "ME601" } }]
  }
];

const DEMO_SUBJECTS = [
  { id: "sub-1", name: "Distributed Systems", code: "CS801", department: "Computer Science", semester: 8 },
  { id: "sub-2", name: "Deep Learning & NLP", code: "AI602", department: "Computer Science", semester: 6 },
  { id: "sub-3", name: "VLSI Design", code: "EC801", department: "Electronics", semester: 8 },
  { id: "sub-4", name: "Database Systems", code: "IT401", department: "Information Technology", semester: 4 },
  { id: "sub-5", name: "Heat Transfer", code: "ME601", department: "Mechanical", semester: 6 },
  { id: "sub-6", name: "Computer Networks", code: "CS601", department: "Computer Science", semester: 6 },
];

const DEMO_STUDENTS = [
  { id: "st-1", name: "Aarav Sharma", roll_number: "21CS001", class_id: "cls-1", department: "Computer Science", attendance: 98, attendance_percentage: 98, email: "aarav.s@institution.edu", phone: "+91 98765 11111", marks: { cia1: 24, cia2: 25, test1: 20, test2: 19, assignment_marks: 10 } },
  { id: "st-2", name: "Priya Patel", roll_number: "21CS002", class_id: "cls-1", department: "Computer Science", attendance: 96, attendance_percentage: 96, email: "priya.p@institution.edu", phone: "+91 98765 22222", marks: { cia1: 23, cia2: 24, test1: 19, test2: 18, assignment_marks: 10 } },
  { id: "st-3", name: "Rahul Deshmukh", roll_number: "21CS003", class_id: "cls-1", department: "Computer Science", attendance: 94, attendance_percentage: 94, email: "rahul.d@institution.edu", phone: "+91 98765 33333", marks: { cia1: 22, cia2: 23, test1: 18, test2: 18, assignment_marks: 9 } },
  { id: "st-4", name: "Ananya Iyer", roll_number: "21CS004", class_id: "cls-1", department: "Computer Science", attendance: 97, attendance_percentage: 97, email: "ananya.i@institution.edu", phone: "+91 98765 44444", marks: { cia1: 25, cia2: 24, test1: 20, test2: 19, assignment_marks: 10 } },
  { id: "st-5", name: "Rohan Varma", roll_number: "21CS005", class_id: "cls-1", department: "Computer Science", attendance: 88, attendance_percentage: 88, email: "rohan.v@institution.edu", phone: "+91 98765 55555", marks: { cia1: 20, cia2: 21, test1: 17, test2: 16, assignment_marks: 8 } },
  { id: "st-6", name: "Sneha Kulkarni", roll_number: "21CS006", class_id: "cls-1", department: "Computer Science", attendance: 92, attendance_percentage: 92, email: "sneha.k@institution.edu", phone: "+91 98765 66666", marks: { cia1: 21, cia2: 22, test1: 18, test2: 17, assignment_marks: 9 } },
  { id: "st-7", name: "Vikram Malhotra", roll_number: "21CS042", class_id: "cls-1", department: "Computer Science", attendance: 68, attendance_percentage: 68, email: "vikram.m@institution.edu", phone: "+91 98765 77777", marks: { cia1: 14, cia2: 15, test1: 11, test2: 12, assignment_marks: 6 } },
  { id: "st-8", name: "Deepak Choudhary", roll_number: "21CS043", class_id: "cls-1", department: "Computer Science", attendance: 71, attendance_percentage: 71, email: "deepak.c@institution.edu", phone: "+91 98765 88888", marks: { cia1: 15, cia2: 16, test1: 12, test2: 13, assignment_marks: 7 } },
];

export const registryService = {
  // --- Classes ---
  async getClasses() {
    if (!isSupabaseConfigured) {
      return DEMO_CLASSES;
    }

    try {
      const { data, error } = await supabase
        .from('classes_with_counts')
        .select('*, class_claims(*, subjects(*))')
        .order('created_at', { ascending: false });
      
      if (error || !data || data.length === 0) return DEMO_CLASSES;
      return data;
    } catch {
      return DEMO_CLASSES;
    }
  },

  async claimClass(classId: string, subjectId: string) {
    if (!isSupabaseConfigured) {
      return { id: "claim-demo", class_id: classId, subject_id: subjectId };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { id: "claim-demo", class_id: classId, subject_id: subjectId };

    const { data, error } = await supabase
      .from('class_claims')
      .insert({
        teacher_id: user.id,
        class_id: classId,
        subject_id: subjectId
      });
    
    if (error) {
        if (error.code === '23505') throw new Error("Subject already claimed for this class");
        throw error;
    }
    return data;
  },

  async createClass(cls: { name: string; section?: string; year: number; semester?: number; department: string; teacher_id?: string }) {
    if (!isSupabaseConfigured) {
      return { id: `cls-${Date.now()}`, ...cls, student_count: 0 };
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
      let subjs = DEMO_SUBJECTS;
      if (filter?.department) subjs = subjs.filter(s => s.department === filter.department);
      if (filter?.semester) subjs = subjs.filter(s => s.semester === filter.semester);
      return subjs;
    }

    try {
      let query = supabase.from('subjects').select('*');
      if (filter?.department) query = query.eq('department', filter.department);
      if (filter?.semester) query = query.eq('semester', filter.semester);
      
      const { data, error } = await query.order('name', { ascending: true });
      if (error || !data || data.length === 0) return DEMO_SUBJECTS;
      return data;
    } catch {
      return DEMO_SUBJECTS;
    }
  },

  // --- Students ---
  async getAllStudents(page = 0, pageSize = 50) {
    if (!isSupabaseConfigured) {
      return { data: DEMO_STUDENTS, count: DEMO_STUDENTS.length };
    }

    try {
      const from = page * pageSize;
      const to   = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from('students')
        .select('*, classes(name)', { count: 'exact' })
        .order('name', { ascending: true })
        .range(from, to);

      if (error || !data || data.length === 0) return { data: DEMO_STUDENTS, count: DEMO_STUDENTS.length };
      return { data: data || [], count: count || DEMO_STUDENTS.length };
    } catch {
      return { data: DEMO_STUDENTS, count: DEMO_STUDENTS.length };
    }
  },

  async getAllStudentsUnpaginated() {
    if (!isSupabaseConfigured) {
      return DEMO_STUDENTS;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*, classes(name)')
        .order('name', { ascending: true });
      if (error || !data || data.length === 0) return DEMO_STUDENTS;
      return data || [];
    } catch {
      return DEMO_STUDENTS;
    }
  },

  async getStudentsByClass(classId: string, subjectId?: string) {
    if (!isSupabaseConfigured) {
      return DEMO_STUDENTS;
    }

    try {
      const { data: students, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('roll_number', { ascending: true });
      
      if (error || !students || students.length === 0) return DEMO_STUDENTS;

      return students.map(s => ({
        ...s,
        attendance: s.attendance || 95
      }));
    } catch {
      return DEMO_STUDENTS;
    }
  },

  async getStudentsByClassWithMarks(classId: string, subjectId: string) {
    if (!isSupabaseConfigured) {
      return DEMO_STUDENTS;
    }

    try {
      const { data: students, error } = await supabase
        .from('students')
        .select('*, student_marks(*)')
        .eq('class_id', classId)
        .eq('student_marks.subject_id', subjectId)
        .order('roll_number', { ascending: true });
      
      if (error || !students || students.length === 0) return DEMO_STUDENTS;
      return students;
    } catch {
      return DEMO_STUDENTS;
    }
  },

  async addStudent(student: any) {
    return { id: `st-${Date.now()}`, ...student };
  },

  async updateStudent(id: string, updates: any) {
    return { id, ...updates };
  },

  async deleteStudent(id: string) {
    return true;
  },

  async deleteStudentsByClass(classId: string) {
    return true;
  },

  async importStudents(students: any[]) {
    if (!isSupabaseConfigured) {
      return students.map((s, idx) => ({ id: `st-import-${idx}-${Date.now()}`, ...s }));
    }
    try {
      const { data, error } = await supabase
        .from('students')
        .insert(students)
        .select('*');
      if (error || !data) {
        return students.map((s, idx) => ({ id: `st-import-${idx}-${Date.now()}`, ...s }));
      }
      return data;
    } catch {
      return students.map((s, idx) => ({ id: `st-import-${idx}-${Date.now()}`, ...s }));
    }
  },

  async updateStudentMarks(studentId: string, subjectId: string, marks: any) {
    if (!isSupabaseConfigured) {
      return { success: true, ...marks };
    }
    try {
      const { data, error } = await supabase
        .from('student_marks')
        .upsert({
          student_id: studentId,
          subject_id: subjectId,
          ...marks,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,subject_id' });
      if (error) throw error;
      return data;
    } catch {
      return { success: true, ...marks };
    }
  }
};
