import { UnifiedSidebar } from "@/components/layout/unified-sidebar";
import { CommandMenu } from "@/components/ui/command-menu";
import { StudentBottomNav } from "@/components/layout/student-bottom-nav";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth is handled by middleware.ts — no need for double protectRoute call here
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <CommandMenu />
      <UnifiedSidebar variant="student" />
      <main className="flex-1 md:pl-20 xl:pl-64 flex flex-col pt-14 md:pt-0 transition-all duration-300">
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0 custom-scrollbar">
          {children}
        </div>
      </main>
      <StudentBottomNav />
    </div>
  );
}
