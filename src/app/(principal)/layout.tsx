import { UnifiedSidebar } from "@/components/layout/unified-sidebar";

export default function PrincipalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <UnifiedSidebar variant="principal" />
      <main className="md:pl-60 pb-16 md:pb-0 transition-all">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
