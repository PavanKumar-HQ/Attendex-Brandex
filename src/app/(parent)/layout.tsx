import { UnifiedSidebar } from "@/components/layout/unified-sidebar";
import { CommandMenu } from "@/components/ui/command-menu";
import { PoweredByBrandex } from "@/components/ui/powered-by-brandex";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden w-full max-w-full">
      <CommandMenu />
      <UnifiedSidebar variant="parent" />
      <main className="flex-1 md:pl-20 xl:pl-64 flex flex-col pt-14 md:pt-0 transition-all duration-300 min-w-0 max-w-full overflow-x-hidden">
        <div className="flex-1 overflow-y-auto px-0 md:px-6 custom-scrollbar min-w-0 flex flex-col justify-between">
          <div className="w-full min-w-0">{children}</div>
          <div className="hidden md:flex justify-center pt-8 pb-4 border-t border-slate-200/60 mt-8">
            <PoweredByBrandex variant="footer" />
          </div>
        </div>
      </main>
    </div>
  );
}
