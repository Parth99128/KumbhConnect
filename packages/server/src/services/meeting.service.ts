import { prisma } from "../config/database.js";
import {
  centroid,
  haversineDistance,
} from "@stay-connected/shared";
import * as locationService from "./location.service.js";

export async function getPredefinedMeetingPoints() {
  return prisma.meetingPoint.findMany({
    where: { type: "PREDEFINED", isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getGroupMeetingPoints(groupId: string) {
  return prisma.meetingPoint.findMany({
    where: { groupId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function suggestMeetingPoint(
  groupId: string,
  name: string,
  latitude: number,
  longitude: number,
  userId: string
) {
  return prisma.meetingPoint.create({
    data: {
      groupId,
      name,
      latitude,
      longitude,
      type: "SUGGESTED",
    },
  });
}

/**
 * Algorithm: Find optimal meeting point for a group.
 * 1. Get all member locations
 * 2. Calculate centroid
 * 3. Find nearest predefined meeting point to centroid
 * 4. If no predefined point within 500m, use minimax optimization
 */
export async function suggestOptimalMeetingPoint(groupId: string) {
  const memberLocations = await locationService.getGroupMemberLocations(groupId);

  if (memberLocations.length === 0) {
    throw new Error("No member locations available");
  }

  const validLocations = memberLocations.filter(
    (loc): loc is NonNullable<typeof loc> => loc !== null
  );

  // Calculate geographic centroid
  const center = centroid(
    validLocations.map((loc) => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
    }))
  );

  // Find nearest predefined meeting points
  const predefined = await prisma.meetingPoint.findMany({
    where: { type: "PREDEFINED", isActive: true },
  });

  if (predefined.length === 0) {
    // No predefined points, suggest the centroid itself
    return {
      name: "Group Centroid",
      latitude: center.latitude,
      longitude: center.longitude,
      type: "SUGGESTED" as const,
      memberDistances: validLocations.map((loc) => ({
        userId: loc.userId,
        name: loc.name,
        distanceMeters: haversineDistance(
          loc.latitude,
          loc.longitude,
          center.latitude,
          center.longitude
        ),
      })),
    };
  }

  // Find the predefined point nearest to centroid
  let bestPoint = predefined[0];
  let bestDistance = Infinity;

  for (const point of predefined) {
    const dist = haversineDistance(
      center.latitude,
      center.longitude,
      point.latitude,
      point.longitude
    );
    if (dist < bestDistance) {
      bestDistance = dist;
      bestPoint = point;
    }
  }

  // If nearest predefined point is too far (>500m), use minimax
  if (bestDistance > 500) {
    // Minimax: find point that minimizes maximum travel distance
    let minimaxPoint = predefined[0];
    let minimaxMaxDist = Infinity;

    for (const point of predefined) {
      let maxDist = 0;
      for (const loc of validLocations) {
        const d = haversineDistance(
          loc.latitude,
          loc.longitude,
          point.latitude,
          point.longitude
        );
        if (d > maxDist) maxDist = d;
      }
      if (maxDist < minimaxMaxDist) {
        minimaxMaxDist = maxDist;
        minimaxPoint = point;
      }
    }
    bestPoint = minimaxPoint;
  }

  return {
    id: bestPoint.id,
    name: bestPoint.name,
    description: bestPoint.description,
    latitude: bestPoint.latitude,
    longitude: bestPoint.longitude,
    type: bestPoint.type,
    memberDistances: validLocations.map((loc) => ({
      userId: loc.userId,
      name: loc.name,
      distanceMeters: haversineDistance(
        loc.latitude,
        loc.longitude,
        bestPoint.latitude,
        bestPoint.longitude
      ),
    })),
  };
}
