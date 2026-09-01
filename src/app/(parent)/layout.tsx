import { UnifiedSidebar } from "@/components/layout/unified-sidebar";
import { CommandMenu } from "@/components/ui/command-menu";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth is handled by middleware.ts — no need for double protectRoute call here
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <CommandMenu />
      <UnifiedSidebar variant="parent" />
      <main className="flex-1 md:pl-20 xl:pl-64 flex flex-col pt-14 md:pt-0 transition-all duration-300">
        <div className="flex-1 overflow-y-auto px-0 md:px-6 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
