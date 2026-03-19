// ============================================
// LOCATION TYPES
// ============================================

import type { LocationSource } from "./group";

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface LocationUpdate extends GeoPosition {
  batteryLevel?: number;
  source: LocationSource;
  timestamp: number;
}

export interface LocationHistoryEntry extends LocationUpdate {
  id: string;
  userId: string;
}

export interface DistanceInfo {
  userId: string;
  name: string;
  distanceMeters: number;
  formattedDistance: string;
  bearing: number;
  lastUpdated: number;
}

export type TrackingMode = "high" | "balanced" | "low" | "emergency";

export interface TrackingConfig {
  updateInterval: number;
  enableHighAccuracy: boolean;
  bleAdvertiseInterval: number;
  bleScanInterval: number;
}

export const TRACKING_CONFIGS: Record<TrackingMode, TrackingConfig> = {
  high: {
    updateInterval: 5_000,
    enableHighAccuracy: true,
    bleAdvertiseInterval: 2_000,
    bleScanInterval: 5_000,
  },
  balanced: {
    updateInterval: 15_000,
    enableHighAccuracy: true,
    bleAdvertiseInterval: 10_000,
    bleScanInterval: 15_000,
  },
  low: {
    updateInterval: 60_000,
    enableHighAccuracy: false,
    bleAdvertiseInterval: 30_000,
    bleScanInterval: 60_000,
  },
  emergency: {
    updateInterval: 2_000,
    enableHighAccuracy: true,
    bleAdvertiseInterval: 1_000,
    bleScanInterval: 2_000,
  },
};
