import type { Server, Socket } from "socket.io";
import * as locationService from "../../services/location.service.js";
import { prisma } from "../../config/database.js";
import { haversineDistance } from "@stay-connected/shared";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@stay-connected/shared";

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type SocketClient = Socket<ClientToServerEvents, ServerToClientEvents>;

export function locationHandler(io: IO, socket: SocketClient) {
  socket.on("location:update", async (data) => {
    const userId = socket.data.userId;
    if (!userId) return;

    try {
      // Save to Redis + PostgreSQL
      await locationService.updateLocation(userId, data);

      // Get user name
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      // Broadcast to all groups this user belongs to
      const memberships = await prisma.groupMember.findMany({
        where: { userId, isActive: true },
        select: { groupId: true },
      });

      for (const { groupId } of memberships) {
        // Get all other members in the group to calculate distances
        const roomSockets = await io.in(`group:${groupId}`).fetchSockets();

        for (const remoteSock of roomSockets) {
          if (remoteSock.data.userId === userId) continue;

          // Get the remote user's location to calculate distance
          const remoteLoc = await locationService.getCurrentLocation(
            remoteSock.data.userId!
          );

          let distanceFromYou: number | undefined;
          if (remoteLoc) {
            distanceFromYou = haversineDistance(
              remoteLoc.latitude,
              remoteLoc.longitude,
              data.latitude,
              data.longitude
            );
          }

          remoteSock.emit("location:member-updated", {
            userId,
            name: user?.name ?? "Unknown",
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            batteryLevel: data.batteryLevel,
            source: data.source,
            timestamp: data.timestamp,
            distanceFromYou,
          });
        }
      }
    } catch (err) {
      console.error("Location update error:", err);
    }
  });
}
