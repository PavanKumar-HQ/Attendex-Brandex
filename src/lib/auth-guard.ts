import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Role } from "@/types";

export type UserRole = Role;

export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
  institutionId: string;
  studentId?: string;
  teacherId?: string;
  parentStudentIds?: string[];
}

export function getRoleHomePath(role: string): string {
  const normalized = role?.toUpperCase();
  if (normalized === "SUPER_ADMIN" || normalized === "SUPERADMIN") return "/super-admin";
  if (normalized === "PRINCIPAL") return "/principal";
  if (normalized === "STUDENT") return "/student/dashboard";
  if (normalized === "PARENT") return "/parent/dashboard";
  return "/dashboard";
}

/**
 * Creates an authoritative Supabase Server Client for Server Actions & API routes.
 */
export async function getSupabaseServer() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Handled in middleware
        }
      },
    },
  });
}

/**
 * Authoritative Server-Side Auth Guard.
 * Derives user role, institution, and entity IDs directly from the database.
 */
export async function requireAuth(): Promise<AuthContext> {
  const supabase = await getSupabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("AUTH_REQUIRED: Authentication is required to access this resource.");
  }

  // Authoritative profile lookup from database
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("institution_id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("PROFILE_NOT_FOUND: User does not belong to an active institution.");
  }

  const context: AuthContext = {
    userId: user.id,
    email: user.email || '',
    role: profile.role as UserRole,
    institutionId: profile.institution_id,
  };

  // Populate role-specific context
  if (profile.role === "STUDENT") {
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (student) context.studentId = student.id;
  } else if (profile.role === "TEACHER") {
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (teacher) context.teacherId = teacher.id;
  } else if (profile.role === "PARENT") {
    const { data: parent } = await supabase
      .from("parents")
      .select("id")
      .eq("user_id", user.id)
      .single();
    
    if (parent) {
      const { data: links } = await supabase
        .from("parent_student_relationships")
        .select("student_id")
        .eq("parent_id", parent.id)
        .eq("is_verified", true);
      context.parentStudentIds = links?.map(l => l.student_id) || [];
    }
  }

  return context;
}

/**
 * Enforces that current user belongs to one of the specified roles.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthContext> {
  const context = await requireAuth();
  if (!allowedRoles.includes(context.role)) {
    throw new Error(`FORBIDDEN: User role '${context.role}' is not authorized for this action.`);
  }
  return context;
}
