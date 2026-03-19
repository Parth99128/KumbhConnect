import Dexie, { type EntityTable } from "dexie";

interface CachedLocation {
  id?: number;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  batteryLevel?: number;
  source: string;
  timestamp: number;
  synced: boolean;
}

interface CachedGroup {
  id: string;
  name: string;
  inviteCode: string;
  members: string; // JSON-serialized
  lastUpdated: number;
}

interface CachedTile {
  key: string; // "z/x/y"
  blob: Blob;
  cachedAt: number;
}

interface SyncQueueEntry {
  id?: number;
  type: "location" | "sos" | "group_action";
  payload: string; // JSON
  createdAt: number;
  retries: number;
}

const db = new Dexie("StayConnectedDB") as Dexie & {
  locations: EntityTable<CachedLocation, "id">;
  groups: EntityTable<CachedGroup, "id">;
  tiles: EntityTable<CachedTile, "key">;
  syncQueue: EntityTable<SyncQueueEntry, "id">;
};

db.version(1).stores({
  locations: "++id, userId, timestamp, synced",
  groups: "id, inviteCode, lastUpdated",
  tiles: "key, cachedAt",
  syncQueue: "++id, type, createdAt",
});

export { db };
export type { CachedLocation, CachedGroup, CachedTile, SyncQueueEntry };
