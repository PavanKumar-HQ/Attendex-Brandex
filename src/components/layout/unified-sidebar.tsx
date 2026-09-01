/**
 * Attendex — Unified Sidebar & Responsive Mobile Navigation Drawer
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  Bell,
  GraduationCap,
  Settings,
  SearchCode,
  Activity,
  RefreshCcw,
  BookOpen,
  History,
  UserRound,
  Home,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Library,
  Trophy,
  Medal,
  Award as AwardIcon,
  Calendar,
  CheckSquare,
  Receipt,
  QrCode,
  Phone,
  Briefcase,
  Calculator,
  CalendarDays,
  FileCheck2,
  Shield,
  Ticket,
  Building2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useBranding } from "@/context/branding-context";

interface SidebarLink {
  name: string;
  href: string;
  icon: any;
}

const ADMIN_LINKS: SidebarLink[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Mark Attendance", href: "/attendance", icon: CheckCircle },
  { name: "Campus Telemetry", href: "/pulse", icon: Activity },
  { name: "Students", href: "/students", icon: Users },
  { name: "Classes", href: "/classes", icon: GraduationCap },
  { name: "Subjects", href: "/subjects", icon: Library },
  { name: "CIA Marks", href: "/results/manage", icon: AwardIcon },
  { name: "Results & Exams", href: "/results", icon: BookOpen },
  { name: "Timetable", href: "/timetable", icon: Calendar },
  { name: "Promotions", href: "/promotion", icon: RefreshCcw },
  { name: "Audit Logs", href: "/audit", icon: SearchCode },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { name: "Sports & Events", href: "/sports", icon: Medal },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

const STUDENT_LINKS: SidebarLink[] = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Marks & Grades", href: "/student/marks", icon: BookOpen },
  { name: "Attendance Log", href: "/student/history", icon: History },
  { name: "Class Timetable", href: "/student/timetable", icon: Calendar },
  { name: "Course Curriculum", href: "/student/curriculum", icon: Library },
  { name: "Assignments & Labs", href: "/student/assignments", icon: CheckSquare },
  { name: "Safe Margin Calculator", href: "/student/calculator", icon: Calculator },
  { name: "Career & Placements", href: "/student/placement", icon: Briefcase },
  { name: "Digital Gatepass", href: "/student/gatepass", icon: Ticket },
  { name: "Exam Hall Ticket", href: "/student/hall-ticket", icon: QrCode },
  { name: "My Profile", href: "/student/profile", icon: UserRound },
];

const PARENT_LINKS: SidebarLink[] = [
  { name: "Overview", href: "/parent/dashboard", icon: Home },
  { name: "Academic Standing", href: "/parent/marks", icon: BookOpen },
  { name: "Attendance History", href: "/parent/history", icon: History },
  { name: "Class Timetable", href: "/parent/timetable", icon: Calendar },
  { name: "Leave & Exemption", href: "/parent/leave", icon: FileCheck2 },
  { name: "Academic Calendar", href: "/parent/calendar", icon: CalendarDays },
  { name: "Fee & Dues Ledger", href: "/parent/fees", icon: Receipt },
  { name: "Proctor Advisory", href: "/parent/proctor", icon: Phone },
  { name: "Conduct & Discipline", href: "/parent/conduct", icon: Shield },
  { name: "Notifications", href: "/parent/notifications", icon: Bell },
];

const PRINCIPAL_LINKS: SidebarLink[] = [
  { name: "Executive Overview", href: "/principal", icon: LayoutDashboard },
  { name: "Mark Attendance", href: "/attendance", icon: CheckCircle },
  { name: "Campus Telemetry", href: "/pulse", icon: Activity },
  { name: "Students", href: "/students", icon: Users },
  { name: "Classes", href: "/classes", icon: GraduationCap },
  { name: "Subjects", href: "/subjects", icon: Library },
  { name: "CIA Marks", href: "/results/manage", icon: AwardIcon },
  { name: "Timetable", href: "/timetable", icon: Calendar },
  { name: "Promotions", href: "/promotion", icon: RefreshCcw },
  { name: "Audit Logs", href: "/audit", icon: SearchCode },
  { name: "Notifications", href: "/notifications", icon: Bell },
];

const SUPER_ADMIN_LINKS: SidebarLink[] = [
  { name: "Platform Overview", href: "/super-admin", icon: LayoutDashboard },
  { name: "Institutions", href: "/super-admin", icon: Building2 },
  { name: "Audit Ledger", href: "/audit", icon: SearchCode },
  { name: "Settings", href: "/settings", icon: Settings },
];

const VARIANT_CONFIG = {
  admin: {
    links: ADMIN_LINKS,
    title: "Attendex",
    subtitle: "Faculty & Admin",
    showSettings: true,
  },
  principal: {
    links: PRINCIPAL_LINKS,
    title: "Attendex",
    subtitle: "Principal Authority",
    showSettings: true,
  },
  super_admin: {
    links: SUPER_ADMIN_LINKS,
    title: "Attendex",
    subtitle: "Super Admin Platform",
    showSettings: true,
  },
  student: {
    links: STUDENT_LINKS,
    title: "Attendex",
    subtitle: "Student Portal",
    showSettings: false,
  },
  parent: {
    links: PARENT_LINKS,
    title: "Attendex",
    subtitle: "Guardian Portal",
    showSettings: false,
  },
  teacher: {
    links: ADMIN_LINKS,
    title: "Attendex",
    subtitle: "Faculty Portal",
    showSettings: true,
  },
} as const;

type SidebarVariant = keyof typeof VARIANT_CONFIG;

interface UnifiedSidebarProps {
  variant: SidebarVariant;
}

export function UnifiedSidebar({ variant }: UnifiedSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { branding } = useBranding();
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.admin;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280 && window.innerWidth >= 768) setIsCollapsed(true);
      else if (window.innerWidth >= 1280) setIsCollapsed(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-800 select-none">
      {/* Brand Header */}
      <div className={cn(
        "flex items-center h-16 border-b border-slate-200/80 transition-all",
        isCollapsed ? "px-3 justify-center" : "px-5"
      )}>
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <GraduationCap className="w-5 h-5 text-blue-400" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-base text-slate-900 tracking-tight">{branding.name || "Attendex"}</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{config.subtitle}</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {!isCollapsed && (
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3 pt-1">
            Menu Navigation
          </div>
        )}

        {config.links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/dashboard" && link.href !== "/student/dashboard" && link.href !== "/parent/dashboard" && pathname?.startsWith(link.href));
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 h-10 rounded-xl text-xs font-semibold transition-all",
                isActive 
                  ? "bg-slate-900 text-white shadow-sm px-3 font-semibold" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 px-3 font-medium",
                isCollapsed && "px-0 justify-center w-10 mx-auto"
              )}
            >
              <link.icon className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-700"
              )} />
              {!isCollapsed && <span className="truncate">{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div className="p-3 border-t border-slate-200/80 space-y-1">
        {config.showSettings && (
          <Link
            href="/settings"
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 h-9 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all",
              isCollapsed ? "px-0 justify-center w-9 mx-auto" : "px-3"
            )}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            {!isCollapsed && <span>Settings</span>}
          </Link>
        )}

        <button
          onClick={async () => {
            document.cookie = "attendex_demo_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
            try {
              await supabase.auth.signOut();
            } catch {
              // ignore
            }
            toast.success("Signed out successfully");
            window.location.href = "/login";
          }}
          className={cn(
            "flex items-center gap-3 h-9 rounded-lg text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all w-full text-left",
            isCollapsed ? "px-0 justify-center w-9 mx-auto" : "px-3"
          )}
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full h-8 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors hidden xl:flex text-xs font-medium"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sticky Header with Hamburger Toggle */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/90 z-50 md:hidden flex items-center px-4 justify-between shadow-xs">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-xs">
            <GraduationCap className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-sm font-bold text-slate-900 tracking-tight">{branding.name || "Attendex"}</span>
        </Link>
         
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle Menu"
            className="p-2 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 transition-all active:scale-95"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay & Slide Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{branding.name || "Attendex"}</h2>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">{config.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {SidebarContent}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className={cn(
        "hidden md:block fixed left-0 top-0 bottom-0 z-40 border-r border-slate-200/80 bg-white transition-all duration-200 shadow-xs",
        isCollapsed ? "w-16" : "w-60"
      )}>
        {SidebarContent}
      </aside>
    </>
  );
}
