import type { Server, Socket } from "socket.io";
import * as sosService from "../../services/sos.service.js";
import { haversineDistance } from "@stay-connected/shared";
import * as locationService from "../../services/location.service.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@stay-connected/shared";

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type SocketClient = Socket<ClientToServerEvents, ServerToClientEvents>;

export function sosHandler(io: IO, socket: SocketClient) {
  socket.on("sos:trigger", async (data) => {
    const userId = socket.data.userId;
    if (!userId) return;

    try {
      const alert = await sosService.triggerSOS(
        userId,
        data.groupId,
        data.latitude,
        data.longitude,
        data.severity,
        data.message
      );

      // Broadcast to all group members
      const roomSockets = await io
        .in(`group:${data.groupId}`)
        .fetchSockets();

      for (const remoteSock of roomSockets) {
        if (remoteSock.data.userId === userId) continue;

        const remoteLoc = await locationService.getCurrentLocation(
          remoteSock.data.userId!
        );

        let distanceFromYou = 0;
        if (remoteLoc) {
          distanceFromYou = haversineDistance(
            remoteLoc.latitude,
            remoteLoc.longitude,
            data.latitude,
            data.longitude
          );
        }

        remoteSock.emit("sos:alert", {
          alertId: alert.id,
          senderName: alert.senderName,
          senderId: userId,
          latitude: data.latitude,
          longitude: data.longitude,
          message: data.message,
          severity: data.severity,
          distanceFromYou,
        });
      }
    } catch (err) {
      console.error("SOS trigger error:", err);
    }
  });

  socket.on("sos:acknowledge", async (data) => {
    const userId = socket.data.userId;
    if (!userId) return;

    try {
      const { alert, byName } = await sosService.acknowledgeSOS(
        data.alertId,
        userId
      );

      io.in(`group:${alert.groupId}`).emit("sos:acknowledged", {
        alertId: data.alertId,
        byName,
      });
    } catch (err) {
      console.error("SOS acknowledge error:", err);
    }
  });

  socket.on("sos:resolve", async (data) => {
    const userId = socket.data.userId;
    if (!userId) return;

    try {
      const alert = await sosService.resolveSOS(data.alertId);

      io.in(`group:${alert.groupId}`).emit("sos:resolved", {
        alertId: data.alertId,
      });
    } catch (err) {
      console.error("SOS resolve error:", err);
    }
  });
}
