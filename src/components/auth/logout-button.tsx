"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    document.cookie = "attendex_demo_session=; path=/; max-age=0; SameSite=Lax";
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className={className}
    >
      Log out & try another identity
    </button>
  );
}
