import { UnifiedSidebar } from "@/components/layout/unified-sidebar";
import { CommandMenu } from "@/components/ui/command-menu";
import { getSupabaseServer } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { ShieldAlert, Hourglass } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // DEMO MODE: Bypassing Auth
  // const supabaseServer = await createClient();
  // const { data: { user } } = await supabaseServer.auth.getUser();
  // if (!user) redirect("/login");

  // const { data: profile } = await supabaseServer
  //     .from('profiles')
  //     .select('status, role')
  //     .eq('id', user.id)
  //     .single();

  const status: string = "VERIFIED";
  const role: string = "admin";

  // Verification Gate for Teachers (Admins bypass)
  if (status === 'PENDING' && role !== 'admin') {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 flex-col text-center relative">
              <div className="relative z-10 space-y-8 max-w-lg p-10 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center border border-slate-200">
                      <Hourglass className="w-8 h-8 text-slate-700" />
                  </div>
                  <div className="space-y-3">
                      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verification Pending</h1>
                      <p className="text-sm text-slate-500 leading-relaxed">
                          Your Faculty Identity is currently under institutional review. For the college trial, 
                          an administrator must verify your credentials before administrative tools are unlocked.
                      </p>
                  </div>
                  <div className="pt-6 flex flex-col gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-left">
                            <ShieldAlert className="w-5 h-5 text-amber-500" />
                            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Awaiting Manual Audit</p>
                        </div>
                         <LogoutButton className="text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-900 transition-colors py-4 mt-2" />
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <CommandMenu />
      <UnifiedSidebar variant={role as any} />
      <main className="flex-1 md:pl-20 xl:pl-64 flex flex-col pt-14 md:pt-0 transition-all duration-300">
        <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-10 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}

