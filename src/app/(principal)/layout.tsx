import { UnifiedSidebar } from "@/components/layout/unified-sidebar";
import { PoweredByBrandex } from "@/components/ui/powered-by-brandex";

export default function PrincipalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 w-full max-w-full overflow-x-hidden flex flex-col justify-between">
      <UnifiedSidebar variant="principal" />
      <main className="md:pl-20 xl:pl-64 pt-14 md:pt-0 transition-all duration-300 min-w-0 max-w-full overflow-x-hidden flex-1 flex flex-col justify-between">
        <div className="p-3.5 sm:p-4 md:p-8 max-w-7xl mx-auto w-full min-w-0">
          {children}
        </div>
        <div className="hidden md:flex justify-center pt-8 pb-4 border-t border-slate-200/60 max-w-7xl mx-auto w-full">
          <PoweredByBrandex variant="footer" />
        </div>
      </main>
    </div>
  );
}
