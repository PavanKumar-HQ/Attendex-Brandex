"use client";

import { CheckCircle2, RefreshCcw, Bell } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AttendanceSyncDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSync: () => void;
  isSaving: boolean;
  stats: {
    present: number;
    absent: number;
    od: number;
  };
  lecture: string;
  date: Date;
  sampleAbsentRoll?: string;
  triggerClassName?: string;
}

export function AttendanceSyncDialog({
  isOpen,
  onOpenChange,
  onSync,
  isSaving,
  stats,
  lecture,
  date,
  sampleAbsentRoll,
  triggerClassName
}: AttendanceSyncDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger render={
        <Button className={cn(
          "h-10 px-4 md:px-5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2 text-xs md:text-sm",
          triggerClassName
        )}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Submit Roll Call</span>
          <span className="sm:hidden">Submit</span>
        </Button>
      } />
      <DialogContent className="sm:max-w-[450px] rounded-2xl p-0 overflow-hidden bg-white border border-slate-200 text-slate-900 shadow-xl">
        <div className="p-6 md:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-slate-900">Confirm Roll Call</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-xs mt-1">
              Review attendance for <strong>{lecture}</strong> before saving to registry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-2xl font-bold text-emerald-700">{stats.present}</div>
                <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mt-0.5">Present</div>
              </div>
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-center">
                <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
                <div className="text-[10px] font-semibold text-red-700 uppercase tracking-wider mt-0.5">Absent</div>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-center">
                <div className="text-2xl font-bold text-blue-700">{stats.od}</div>
                <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mt-0.5">OD</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Automated Parent Notice</p>
                  <p className="text-xs text-slate-500 font-medium">{stats.absent} absentees logged</p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Message Format</p>
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-600 italic leading-relaxed shadow-sm">
                  "Attendex Notice: Student (Reg No. {sampleAbsentRoll || '...'}) was ABSENT for Lect. {lecture.replace('L', '')} on {format(date, 'MMM d')}."
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 pt-0 flex flex-col gap-2">
          <Button
            onClick={onSync}
            disabled={isSaving}
            className="h-11 w-full rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {isSaving ? (
              <>
                <RefreshCcw className="w-4 h-4 animate-spin" />
                Saving to Registry...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Save Roll Call
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            className="h-10 w-full rounded-xl text-slate-500 font-semibold text-xs hover:text-slate-900 transition-colors"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


