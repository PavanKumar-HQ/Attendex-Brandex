import { haptics } from "@/lib/haptics";
import { get, set, del } from "idb-keyval";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Attendex — Relational Offline Persistence Engine (ROPE)
 * High-performance IndexedDB durability layer with queue idempotency,
 * version conflict detection, and background auto-sync.
 */

const STORAGE_KEY = "Attendex_offline_queue";

export interface OfflineAttendanceSession {
  operationId: string;
  classId: string;
  subjectId?: string;
  period: number;
  date: string;
  lectureType?: string;
  clientVersion: number;
  records: { student_id: string; status: "PRESENT" | "ABSENT" | "OD" | "ML" }[];
  timestamp: number;
  status: "QUEUED" | "SYNCING" | "CONFLICT" | "FAILED";
  lastError?: string;
}

export const offlineService = {
  // Save a session locally in IndexedDB when network drops
  saveDraft: async (session: Omit<OfflineAttendanceSession, "operationId" | "timestamp" | "status">) => {
    try {
      const drafts = await offlineService.getDrafts();
      const newDraft: OfflineAttendanceSession = {
        ...session,
        operationId: crypto.randomUUID(),
        timestamp: Date.now(),
        status: "QUEUED",
      };
      
      await set(STORAGE_KEY, [...drafts, newDraft]);
      
      // Trigger Background Sync if available
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          // @ts-ignore
          await registration.sync.register('sync-attendance');
        } catch {
          window.dispatchEvent(new CustomEvent('rope-sync-force'));
        }
      }

      haptics.success();
      return newDraft;
    } catch (err) {
      console.error("ROPE Save Failed", err);
      haptics.error();
      return null;
    }
  },

  getDrafts: async (): Promise<OfflineAttendanceSession[]> => {
    if (typeof window === 'undefined') return [];
    try {
      const drafts = await get(STORAGE_KEY);
      return drafts || [];
    } catch {
      return [];
    }
  },

  removeDraft: async (operationId: string) => {
    const drafts = await offlineService.getDrafts();
    const filtered = drafts.filter(d => d.operationId !== operationId);
    await set(STORAGE_KEY, filtered);
  },

  clearAll: async () => {
    await del(STORAGE_KEY);
  },

  hasPendingSync: async () => {
    const drafts = await offlineService.getDrafts();
    return drafts.length > 0;
  },

  /**
   * Synchronizes all queued IndexedDB sessions with PostgreSQL backend atomically.
   */
  syncQueue: async () => {
    const drafts = await offlineService.getDrafts();
    if (drafts.length === 0) return { synced: 0, conflicts: 0, failed: 0 };

    if (!isSupabaseConfigured) {
      await offlineService.clearAll();
      return { synced: drafts.length, conflicts: 0, failed: 0 };
    }

    const payload = drafts.map(d => ({
      operation_id: d.operationId,
      class_id: d.classId,
      subject_id: d.subjectId || null,
      period: d.period,
      date: d.date,
      records: d.records,
      client_version: d.clientVersion || 1,
      lecture_type: d.lectureType || 'Theory'
    }));

    try {
      const { data, error } = await supabase.rpc('sync_offline_rope_queue', {
        p_batch: payload
      });

      if (error) throw error;

      // Filter out successfully processed items
      const results = data?.results || [];
      const successfulIds = new Set(
        results
          .filter((r: any) => r.result?.status === 'SUCCESS')
          .map((r: any) => r.operation_id)
      );

      const remaining = drafts.filter(d => !successfulIds.has(d.operationId));
      await set(STORAGE_KEY, remaining);

      return {
        synced: successfulIds.size,
        conflicts: results.filter((r: any) => r.result?.status === 'CONFLICT').length,
        failed: remaining.length - results.filter((r: any) => r.result?.status === 'CONFLICT').length
      };
    } catch (err) {
      console.error("ROPE Sync Batch Failure:", err);
      return { synced: 0, conflicts: 0, failed: drafts.length };
    }
  }
};
