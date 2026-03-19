import { prisma } from "../config/database.js";
import { redis } from "../config/redis.js";
import type { LocationSource } from "@stay-connected/shared";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  batteryLevel?: number;
  source: LocationSource;
  timestamp: number;
}

// Store location in Redis (real-time) and batch to PostgreSQL
export async function updateLocation(userId: string, data: LocationData) {
  const redisKey = `loc:${userId}`;

  // Write to Redis for real-time access (TTL: 5 minutes)
  await redis.hmset(redisKey, {
    lat: data.latitude.toString(),
    lng: data.longitude.toString(),
    accuracy: (data.accuracy ?? 0).toString(),
    battery: (data.batteryLevel ?? -1).toString(),
    source: data.source,
    timestamp: data.timestamp.toString(),
  });
  await redis.expire(redisKey, 300); // 5 minutes TTL

  // Persist to PostgreSQL
  await prisma.locationHistory.create({
    data: {
      userId,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      altitude: data.altitude,
      heading: data.heading,
      speed: data.speed,
      batteryLevel: data.batteryLevel,
      source: data.source as any,
      timestamp: new Date(data.timestamp),
    },
  });

  // Update user last seen
  await prisma.user.update({
    where: { id: userId },
    data: { lastSeenAt: new Date() },
  });
}

// Get current location from Redis (fast)
export async function getCurrentLocation(userId: string) {
  const data = await redis.hgetall(`loc:${userId}`);
  if (!data.lat) return null;

  return {
    latitude: parseFloat(data.lat),
    longitude: parseFloat(data.lng),
    accuracy: parseFloat(data.accuracy),
    batteryLevel: parseFloat(data.battery),
    source: data.source as LocationSource,
    timestamp: parseInt(data.timestamp),
  };
}

// Get all member locations for a group
export async function getGroupMemberLocations(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        where: { isActive: true },
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!group) return [];

  const locations = await Promise.all(
    group.members.map(async (member) => {
      const loc = await getCurrentLocation(member.userId);
      if (!loc) {
        // Fallback to last known location from PostgreSQL
        const lastKnown = await prisma.locationHistory.findFirst({
          where: { userId: member.userId },
          orderBy: { timestamp: "desc" },
        });
        if (!lastKnown) return null;

        return {
          userId: member.userId,
          name: member.nickname || member.user.name,
          latitude: lastKnown.latitude,
          longitude: lastKnown.longitude,
          accuracy: lastKnown.accuracy ?? 0,
          batteryLevel: lastKnown.batteryLevel ?? undefined,
          source: lastKnown.source as LocationSource,
          timestamp: lastKnown.timestamp.getTime(),
        };
      }

      return {
        userId: member.userId,
        name: member.nickname || member.user.name,
        ...loc,
      };
    })
  );

  return locations.filter(Boolean);
}

// Batch upload queued offline locations
export async function bulkUploadLocations(
  userId: string,
  entries: LocationData[]
) {
  await prisma.locationHistory.createMany({
    data: entries.map((entry) => ({
      userId,
      latitude: entry.latitude,
      longitude: entry.longitude,
      accuracy: entry.accuracy,
      batteryLevel: entry.batteryLevel,
      source: entry.source as any,
      timestamp: new Date(entry.timestamp),
    })),
  });

  // Update Redis with the most recent entry
  const latest = entries.sort((a, b) => b.timestamp - a.timestamp)[0];
  if (latest) {
    await updateLocation(userId, latest);
  }

  return { uploaded: entries.length };
}
