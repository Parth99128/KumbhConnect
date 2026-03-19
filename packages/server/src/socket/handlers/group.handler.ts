import type { Server, Socket } from "socket.io";
import { prisma } from "../../config/database.js";
import * as locationService from "../../services/location.service.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@stay-connected/shared";

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type SocketClient = Socket<ClientToServerEvents, ServerToClientEvents>;

export function groupHandler(io: IO, socket: SocketClient) {
  socket.on("group:join", async (data) => {
    const userId = socket.data.userId;
    if (!userId) return;

    try {
      // Verify membership
      const member = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId, groupId: data.groupId } },
        include: { user: { select: { name: true } } },
      });

      if (!member || !member.isActive) {
        return;
      }

      // Join the Socket.IO room
      socket.join(`group:${data.groupId}`);

      // Notify other members
      socket.to(`group:${data.groupId}`).emit("group:member-joined", {
        userId,
        name: member.user.name,
      });

      // Send all current member locations to the joining user
      const locations = await locationService.getGroupMemberLocations(
        data.groupId
      );
      socket.emit("location:all-members", locations as any);
    } catch (err) {
      console.error("Group join error:", err);
    }
  });

  socket.on("group:leave", async (data) => {
    const userId = socket.data.userId;
    if (!userId) return;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      socket.leave(`group:${data.groupId}`);

      socket.to(`group:${data.groupId}`).emit("group:member-left", {
        userId,
        name: user?.name ?? "Unknown",
      });
    } catch (err) {
      console.error("Group leave error:", err);
    }
  });
}
