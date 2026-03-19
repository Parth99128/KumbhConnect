import { db, type SyncQueueEntry } from "./index.ts";
import api from "../services/api.ts";

/**
 * Add an item to the sync queue (for offline mutations).
 */
export async function enqueue(
  type: SyncQueueEntry["type"],
  payload: object
) {
  await db.syncQueue.add({
    type,
    payload: JSON.stringify(payload),
    createdAt: Date.now(),
    retries: 0,
  });
}

/**
 * Flush the sync queue when back online.
 */
export async function flushSyncQueue() {
  const entries = await db.syncQueue.orderBy("createdAt").toArray();

  for (const entry of entries) {
    try {
      const payload = JSON.parse(entry.payload);

      switch (entry.type) {
        case "location":
          await api.post("/locations/bulk", { entries: [payload] });
          break;
        case "sos":
          await api.post("/sos", payload);
          break;
        case "group_action":
          // Handle group join/leave
          if (payload.action === "join") {
            await api.post(`/groups/${payload.groupId}/join`, {
              inviteCode: payload.inviteCode,
            });
          }
          break;
      }

      // Remove successfully synced entry
      await db.syncQueue.delete(entry.id!);
    } catch (err) {
      // Increment retry count
      await db.syncQueue.update(entry.id!, {
        retries: entry.retries + 1,
      });

      // Remove after 5 failed retries
      if (entry.retries >= 5) {
        await db.syncQueue.delete(entry.id!);
      }
    }
  }
}

/**
 * Get count of pending sync entries.
 */
export async function getPendingCount(): Promise<number> {
  return db.syncQueue.count();
}
