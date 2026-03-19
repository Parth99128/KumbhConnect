// ============================================
// APP-WIDE CONSTANTS
// ============================================

// Kumbh Mela (Prayagraj) approximate bounding box for map tiles
export const KUMBH_MELA_BOUNDS = {
  north: 25.46,
  south: 25.41,
  east: 81.91,
  west: 81.86,
  center: { lat: 25.435, lng: 81.885 },
  defaultZoom: 14,
};

// Location update intervals
export const LOCATION_STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
export const LOCATION_EXPIRE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
export const LOCATION_BATCH_PERSIST_INTERVAL_MS = 30 * 1000; // 30 seconds

// Mesh networking
export const MESH_MAX_HOP_COUNT = 3;
export const BLE_SERVICE_UUID = "12345678-1234-1234-1234-123456789abc";
export const BLE_LOCATION_CHAR_UUID = "12345678-1234-1234-1234-123456789abd";

// Group constraints
export const MAX_GROUP_SIZE = 50;
export const INVITE_CODE_LENGTH = 6;

// Map tile cache
export const TILE_CACHE_ZOOM_MIN = 12;
export const TILE_CACHE_ZOOM_MAX = 17;
export const TILE_APPROX_SIZE_KB = 20;

// SOS
export const SOS_AUTO_EXPIRE_HOURS = 4;
export const SOS_ESCALATION_MINUTES = 15;

// Battery thresholds
export const BATTERY_HIGH_THRESHOLD = 0.5;
export const BATTERY_LOW_THRESHOLD = 0.2;
export const BATTERY_CRITICAL_THRESHOLD = 0.1;
