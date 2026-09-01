"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, XCircle, Clock, FileText, Calendar } from "lucide-react";
import { workflowService, ApprovalTask } from "@/services/workflow.service";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function TeacherActionQueue() {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<ApprovalTask[]>({
    queryKey: ["teacher-approval-tasks"],
    queryFn: () => workflowService.getAssignedTasks("TEACHER"),
    refetchInterval: 10000,
  });

  // Supabase Realtime Subscription on approval_tasks
  useEffect(() => {
    const channel = supabase
      .channel("realtime-teacher-approval-tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "approval_tasks" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["teacher-approval-tasks"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leave_requests" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["teacher-approval-tasks"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const decisionMutation = useMutation({
    mutationFn: ({ taskId, decision, comment }: { taskId: string; decision: "APPROVED" | "REJECTED"; comment?: string }) =>
      workflowService.processDecision(taskId, decision, comment),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message);
        queryClient.invalidateQueries({ queryKey: ["teacher-approval-tasks"] });
      } else {
        toast.error(res.message);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to process task.");
    }
  });

  const handleDecision = (taskId: string, decision: "APPROVED" | "REJECTED") => {
    let comment: string | undefined = undefined;
    if (decision === "REJECTED") {
      const inputReason = window.prompt("Enter mandatory reason for rejection:");
      if (!inputReason || inputReason.trim().length === 0) {
        toast.error("Rejection cancelled: Reason is mandatory.");
        return;
      }
      comment = inputReason.trim();
    }
    decisionMutation.mutate({ taskId, decision, comment });
  };

  return (
    <Card className="p-6 border-slate-200 shadow-sm rounded-xl bg-white space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Assigned Action Items & Approvals</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Parent medical exemptions & student gatepass requests awaiting your review
          </p>
        </div>
        <span className={cn(
          "text-xs font-bold px-2.5 py-1 rounded-full border",
          tasks.length > 0 
            ? "text-amber-700 bg-amber-50 border-amber-200"
            : "text-emerald-700 bg-emerald-50 border-emerald-200"
        )}>
          {tasks.length > 0 ? `${tasks.length} Pending Review` : "0 Pending"}
        </span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading assigned tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
          ✓ All student exemption requests and gatepass items processed. Zero pending tasks.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5 text-xs flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    task.requestType === "LEAVE" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                  )}>
                    {task.requestType} REQUEST
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{task.createdAt}</span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {task.studentName} ({task.rollNumber})
                  </h4>
                  {task.datesOrTime && (
                    <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{task.datesOrTime}</span>
                    </p>
                  )}
                  {task.reason && (
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {task.reason}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={decisionMutation.isPending}
                  onClick={() => handleDecision(task.id, "REJECTED")}
                  className="h-8 text-rose-600 border-slate-200 hover:bg-rose-50 text-xs font-semibold rounded-lg px-3"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  disabled={decisionMutation.isPending}
                  onClick={() => handleDecision(task.id, "APPROVED")}
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg px-3 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
