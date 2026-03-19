// ============================================
// DISTANCE UTILITIES (Haversine Formula)
// Works offline - no server required
// ============================================

const EARTH_RADIUS_METERS = 6_371_000;

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Haversine formula - calculates great-circle distance between two points
 * on Earth given their latitude and longitude in decimal degrees.
 * @returns distance in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Format distance for human display: "150 m", "1.2 km", etc.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Calculate bearing from point 1 to point 2 in degrees (0-360).
 * 0 = North, 90 = East, 180 = South, 270 = West.
 */
export function bearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Calculate geographic midpoint (centroid) of multiple coordinates.
 * Used for suggesting optimal meeting points.
 */
export function centroid(
  points: { latitude: number; longitude: number }[]
): { latitude: number; longitude: number } {
  if (points.length === 0) {
    throw new Error("Cannot calculate centroid of empty point set");
  }
  if (points.length === 1) {
    return { latitude: points[0].latitude, longitude: points[0].longitude };
  }

  let x = 0;
  let y = 0;
  let z = 0;

  for (const point of points) {
    const lat = toRad(point.latitude);
    const lon = toRad(point.longitude);
    x += Math.cos(lat) * Math.cos(lon);
    y += Math.cos(lat) * Math.sin(lon);
    z += Math.sin(lat);
  }

  const n = points.length;
  x /= n;
  y /= n;
  z /= n;

  const centralLon = Math.atan2(y, x);
  const centralLat = Math.atan2(z, Math.sqrt(x * x + y * y));

  return {
    latitude: toDeg(centralLat),
    longitude: toDeg(centralLon),
  };
}
