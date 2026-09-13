"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export type CoreRole = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: CoreRole;
  roleLabel: string;
  avatar: string;
  homePath: string;
  institutionName: string;
}

export const PRESET_USERS: Record<CoreRole, UserSession> = {
  ADMIN: {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Dr. K. S. Ramanujam",
    email: "principal@attendex.edu",
    role: "ADMIN",
    roleLabel: "Principal & Institutional Admin",
    avatar: "KR",
    homePath: "/principal",
    institutionName: "Global Institute of Technology & Engineering"
  },
  TEACHER: {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Prof. Rajesh Verma",
    email: "faculty@attendex.edu",
    role: "TEACHER",
    roleLabel: "Senior Faculty & Proctor",
    avatar: "RV",
    homePath: "/dashboard",
    institutionName: "Global Institute of Technology & Engineering"
  },
  STUDENT: {
    id: "00000000-0000-0000-0000-000000000004",
    name: "Rahul Deshmukh",
    email: "rahul.d@attendex.edu",
    role: "STUDENT",
    roleLabel: "Undergraduate (21CS042)",
    avatar: "RD",
    homePath: "/student/dashboard",
    institutionName: "Global Institute of Technology & Engineering"
  },
  PARENT: {
    id: "00000000-0000-0000-0000-000000000005",
    name: "Suresh Deshmukh",
    email: "parent@attendex.edu",
    role: "PARENT",
    roleLabel: "Registered Guardian",
    avatar: "SD",
    homePath: "/parent/dashboard",
    institutionName: "Global Institute of Technology & Engineering"
  }
};

interface AuthContextType {
  currentUser: UserSession;
  role: CoreRole;
  switchRole: (newRole: CoreRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: PRESET_USERS.TEACHER,
  role: "TEACHER",
  switchRole: () => {}
});

const ROLE_STORAGE_KEY = "attendex_active_role_v2";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<CoreRole>("TEACHER");
  const [customUser, setCustomUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    // Determine initial role and custom name from cookies/path/storage
    if (typeof window !== "undefined") {
      // 1. Check cookies for real user name, roll, and email
      const cookies = document.cookie.split(";").map(c => c.trim());
      const nameCookie = cookies.find(c => c.startsWith("attendex_user_name=") || c.startsWith("attendex_student_name="));
      const emailCookie = cookies.find(c => c.startsWith("attendex_user_email="));
      const sessionRoleCookie = cookies.find(c => c.startsWith("attendex_demo_session="));

      let resolvedName = "";
      if (nameCookie) {
        try {
          resolvedName = decodeURIComponent(nameCookie.split("=")[1]).trim();
        } catch {
          // ignore
        }
      }
      if (!resolvedName) {
        resolvedName = localStorage.getItem("attendex_user_name") || "";
      }

      let resolvedEmail = "";
      if (emailCookie) {
        try {
          resolvedEmail = decodeURIComponent(emailCookie.split("=")[1]).trim();
        } catch {
          // ignore
        }
      }

      if (resolvedName || resolvedEmail) {
        setCustomUser({
          name: resolvedName || "Authorized User",
          email: resolvedEmail || "user@attendex.edu"
        });
      }

      // 2. Resolve Role
      if (pathname.startsWith("/principal") || pathname.startsWith("/super-admin")) {
        setRole("ADMIN");
      } else if (pathname.startsWith("/student")) {
        setRole("STUDENT");
      } else if (pathname.startsWith("/parent")) {
        setRole("PARENT");
      } else if (sessionRoleCookie) {
        const raw = sessionRoleCookie.split("=")[1]?.toUpperCase();
        if (raw === "ADMIN" || raw === "SUPER_ADMIN" || raw === "PRINCIPAL") setRole("ADMIN");
        else if (raw === "STUDENT") setRole("STUDENT");
        else if (raw === "PARENT") setRole("PARENT");
        else setRole("TEACHER");
      } else {
        const stored = localStorage.getItem(ROLE_STORAGE_KEY) as CoreRole;
        if (stored && PRESET_USERS[stored]) {
          setRole(stored);
        }
      }
    }
  }, [pathname]);

  const switchRole = (newRole: CoreRole) => {
    setRole(newRole);
    if (typeof window !== "undefined") {
      localStorage.setItem(ROLE_STORAGE_KEY, newRole);
      document.cookie = `attendex_demo_session=${newRole.toLowerCase()}; path=/; max-age=604800; SameSite=Lax`;
    }
    const target = PRESET_USERS[newRole].homePath;
    router.push(target);
  };

  const preset = PRESET_USERS[role];
  const displayName = customUser?.name || preset.name;
  const displayEmail = customUser?.email || preset.email;

  // Compute initials from real name
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join("") || preset.avatar;

  const currentUser: UserSession = {
    ...preset,
    name: displayName,
    email: displayEmail,
    avatar: initials,
  };

  return (
    <AuthContext.Provider value={{ currentUser, role, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
