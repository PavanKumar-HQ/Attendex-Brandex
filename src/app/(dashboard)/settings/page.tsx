"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/ui/page-transition";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { UploadCloud, ShieldCheck, RefreshCcw } from "lucide-react";
import { PasskeyCard } from "@/components/auth/passkey-card";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";


export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const DEMO_PROFILE = {
        full_name: "Dr. S. Kulkarni",
        email: "s.kulkarni@institution.edu",
        phone: "+91 98450 12345",
        role: "FACULTY",
        department: "Computer Science & Engineering",
        metadata: { full_name: "Dr. S. Kulkarni", phone: "+91 98450 12345" }
      };

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return DEMO_PROFILE;

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        return {
          ...data,
          email: user.email,
          metadata: user.user_metadata
        };
      } catch {
        return DEMO_PROFILE;
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedProfile: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updatedProfile.name,
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile synchronized with institution.");
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err: any) => toast.error("Sync failed", { description: err.message }),
  });

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");

  useEffect(() => {
    if (profileData) {
      setFormName(profileData.full_name || profileData.metadata?.full_name || "");
      setFormPhone(profileData.phone || profileData.metadata?.phone || "");
    }
  }, [profileData]);


  const isSaving = updateMutation.isPending;
  const handleSave = () => updateMutation.mutate({ name: formName, phone: formPhone });

  return (
    <PageTransition>
      <div className="flex flex-col min-h-full">
        <Header title="Settings" />
        
        {isLoading ? (
            <div className="flex-1 py-24 flex flex-col items-center justify-center">
                <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-sm font-semibold text-slate-500">Loading Configuration...</p>
            </div>
        ) : (
        <div className="flex-1 py-8 max-w-4xl space-y-8">
          
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Profile Configuration</h2>
            <p className="text-sm text-slate-500">Update your personal details and teacher identification.</p>
          </div>

          <Card className="p-8 border-slate-200 shadow-sm rounded-2xl bg-white">
            <div className="flex flex-col md:flex-row gap-10">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-32 h-32 border-4 border-white shadow-md rounded-full">
                  <AvatarImage src={profileData?.avatar_url || profileData?.metadata?.avatar_url} alt="Profile" />
                  <AvatarFallback className="text-3xl bg-slate-900 text-white font-black">
                    {formName?.split(' ').map(n => n[0]).join('').toUpperCase() || "AJ"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-full shadow-sm text-[10px] font-black uppercase tracking-widest border-slate-200">
                    <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                    Upload
                  </Button>
                </div>
              </div>

              {/* Form Section */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</Label>
                    <Input 
                      id="name" 
                      value={formName} 
                      onChange={(e) => setFormName(e.target.value)}
                      className="rounded-2xl h-14 border-slate-200 focus-visible:ring-blue-500 shadow-none font-bold px-5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacherId" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity ID</Label>
                    <Input 
                      id="teacherId" 
                      value={profileData?.faculty_id || profileData?.roll_number || "N/A"}
                      readOnly
                      className="rounded-2xl h-14 border-slate-100 bg-slate-50 text-slate-400 shadow-none font-bold px-5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={profileData?.email || ""}
                    readOnly
                    className="rounded-2xl h-14 border-slate-100 bg-slate-50 text-slate-400 shadow-none font-bold px-5"
                  />
                  <p className="text-[10px] font-bold text-slate-400 max-w-[400px] uppercase tracking-wider mt-2 ml-1">Institutional email is managed by your administrator.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Recovery Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="rounded-2xl h-14 border-slate-200 focus-visible:ring-blue-500 shadow-none font-bold px-5 w-full md:w-[60%]"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="rounded-xl px-8 h-11 bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                  >
                    {isSaving ? "Saving details..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-1 mt-12">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Security & Sovereignty</h2>
            <p className="text-sm text-slate-500">Enable advanced authentication and hardware-level identity binding.</p>
          </div>

          <PasskeyCard />
        </div>
        )}
      </div>
    </PageTransition>
  );
}
