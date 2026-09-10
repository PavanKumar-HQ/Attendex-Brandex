/**
 * Attendex Asynchronous Offline Sync Queue
 * Allows student and faculty operations (attendance, marks, gatepasses)
 * to be safely executed offline or in low-connectivity areas,
 * persisting them locally and auto-flushing upon network restoration.
 */

export interface QueuedRequest {
  id: string;
  url: string;
  method: "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body: any;
  label: string;
  timestamp: number;
  retries: number;
}

const STORAGE_KEY = "attendex_offline_sync_queue";

class OfflineSyncQueue {
  private listeners: Set<(queue: QueuedRequest[]) => void> = new Set();
  private isSyncing = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.flushQueue();
      });

      // Also listen to Service Worker sync messages
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "OFFLINE_SYNC_TRIGGERED") {
            this.flushQueue();
          }
        });
      }
    }
  }

  getQueue(): QueuedRequest[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: QueuedRequest[]) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      this.notifyListeners(queue);
    } catch (e) {
      console.error("[OfflineQueue] Failed to persist queue:", e);
    }
  }

  /**
   * Enqueue an action when network is offline or fails
   */
  enqueue(action: Omit<QueuedRequest, "id" | "timestamp" | "retries">): QueuedRequest {
    const queue = this.getQueue();
    const item: QueuedRequest = {
      ...action,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      retries: 0
    };

    queue.push(item);
    this.saveQueue(queue);

    // Register background sync with SW if available
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready.then((reg: any) => {
        reg.sync?.register("sync-offline-queue").catch(() => null);
      });
    }

    return item;
  }

  /**
   * Flush all queued items sequentially
   */
  async flushQueue(): Promise<{ processed: number; failed: number }> {
    if (this.isSyncing) return { processed: 0, failed: 0 };
    if (typeof window === "undefined" || !navigator.onLine) {
      return { processed: 0, failed: 0 };
    }

    const queue = this.getQueue();
    if (queue.length === 0) return { processed: 0, failed: 0 };

    this.isSyncing = true;
    let processed = 0;
    let failed = 0;
    const remaining: QueuedRequest[] = [];

    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: {
            "Content-Type": "application/json",
            "X-Offline-Replay": "true",
            ...(item.headers || {})
          },
          body: JSON.stringify(item.body)
        });

        if (response.ok) {
          processed++;
        } else {
          item.retries++;
          if (item.retries < 5) {
            remaining.push(item);
          }
          failed++;
        }
      } catch (err) {
        item.retries++;
        if (item.retries < 5) {
          remaining.push(item);
        }
        failed++;
        break; // Network still disconnected
      }
    }

    this.saveQueue(remaining);
    this.isSyncing = false;
    return { processed, failed };
  }

  subscribe(listener: (queue: QueuedRequest[]) => void) {
    this.listeners.add(listener);
    listener(this.getQueue());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(queue: QueuedRequest[]) {
    this.listeners.forEach((l) => l(queue));
  }
}

export const offlineSyncQueue = new OfflineSyncQueue();
