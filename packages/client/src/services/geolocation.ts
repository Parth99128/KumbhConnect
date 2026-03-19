import {
  TRACKING_CONFIGS,
  BATTERY_HIGH_THRESHOLD,
  BATTERY_LOW_THRESHOLD,
} from "@stay-connected/shared";
import type { TrackingMode, GeoPosition } from "@stay-connected/shared";
import { useLocationStore } from "../stores/locationStore.ts";
import { emitLocation } from "./socket.ts";

let watchId: number | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let currentMode: TrackingMode = "balanced";

export function startTracking(mode?: TrackingMode) {
  if (mode) currentMode = mode;
  stopTracking();

  const config = TRACKING_CONFIGS[currentMode];

  if (!navigator.geolocation) {
    console.error("Geolocation not supported");
    return;
  }

  // Initial position
  navigator.geolocation.getCurrentPosition(
    (pos) => handlePosition(pos),
    (err) => console.error("Geolocation error:", err),
    { enableHighAccuracy: config.enableHighAccuracy, timeout: 10000 }
  );

  // Continuous watching
  watchId = navigator.geolocation.watchPosition(
    (pos) => handlePosition(pos),
    (err) => console.error("Watch error:", err),
    {
      enableHighAccuracy: config.enableHighAccuracy,
      maximumAge: config.updateInterval,
    }
  );

  // Interval-based emission to server
  intervalId = setInterval(() => {
    const myLoc = useLocationStore.getState().myLocation;
    if (myLoc) {
      emitLocation({
        latitude: myLoc.latitude,
        longitude: myLoc.longitude,
        accuracy: myLoc.accuracy ?? 0,
        altitude: myLoc.altitude,
        heading: myLoc.heading,
        speed: myLoc.speed,
        source: "GPS",
        timestamp: Date.now(),
      });
    }
  }, config.updateInterval);
}

export function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function handlePosition(pos: GeolocationPosition) {
  const geoPos: GeoPosition = {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    altitude: pos.coords.altitude ?? undefined,
    heading: pos.coords.heading ?? undefined,
    speed: pos.coords.speed ?? undefined,
  };
  useLocationStore.getState().setMyLocation(geoPos);
}

/**
 * Auto-adjust tracking mode based on battery level.
 */
export async function adjustForBattery() {
  if (!("getBattery" in navigator)) return;

  try {
    const battery = await (navigator as any).getBattery();

    const updateMode = () => {
      const level = battery.level;
      if (level > BATTERY_HIGH_THRESHOLD) {
        setTrackingMode("balanced");
      } else if (level > BATTERY_LOW_THRESHOLD) {
        setTrackingMode("low");
      } else {
        setTrackingMode("low");
      }
    };

    battery.addEventListener("levelchange", updateMode);
    updateMode();
  } catch {
    // Battery API not available
  }
}

export function setTrackingMode(mode: TrackingMode) {
  currentMode = mode;
  startTracking(mode);
}

export function getTrackingMode(): TrackingMode {
  return currentMode;
}
