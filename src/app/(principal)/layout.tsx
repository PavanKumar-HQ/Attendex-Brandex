import { UnifiedSidebar } from "@/components/layout/unified-sidebar";

export default function PrincipalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <UnifiedSidebar variant="principal" />
      <main className="md:pl-20 xl:pl-64 pt-14 md:pt-0 transition-all duration-300">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
