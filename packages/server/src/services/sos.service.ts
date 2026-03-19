import { prisma } from "../config/database.js";
import { redis } from "../config/redis.js";
import type { SOSSeverity } from "@stay-connected/shared";

export async function triggerSOS(
  senderId: string,
  groupId: string,
  latitude: number,
  longitude: number,
  severity: SOSSeverity = "HIGH",
  message?: string
) {
  const alert = await prisma.sOSAlert.create({
    data: {
      senderId,
      groupId,
      latitude,
      longitude,
      message,
      severity: severity as any,
    },
    include: {
      sender: { select: { name: true } },
    },
  });

  // Add to Redis sorted set for quick active SOS lookups
  await redis.zadd(
    `sos:active:${groupId}`,
    Date.now(),
    alert.id
  );

  return {
    ...alert,
    senderName: alert.sender.name,
  };
}

export async function acknowledgeSOS(alertId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const alert = await prisma.sOSAlert.update({
    where: { id: alertId },
    data: {
      status: "ACKNOWLEDGED",
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
    },
  });

  return { alert, byName: user?.name ?? "Unknown" };
}

export async function resolveSOS(alertId: string) {
  const alert = await prisma.sOSAlert.update({
    where: { id: alertId },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });

  // Remove from active set
  await redis.zrem(`sos:active:${alert.groupId}`, alertId);

  return alert;
}

export async function getActiveSOSForGroup(groupId: string) {
  return prisma.sOSAlert.findMany({
    where: {
      groupId,
      status: { in: ["ACTIVE", "ACKNOWLEDGED"] },
    },
    include: {
      sender: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
