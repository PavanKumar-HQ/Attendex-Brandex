import { UnifiedSidebar } from "@/components/layout/unified-sidebar";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <UnifiedSidebar variant="super_admin" />
      <main className="md:pl-60 pb-16 md:pb-0 transition-all">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
