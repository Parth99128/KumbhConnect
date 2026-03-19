import { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import { locationHandler } from "./handlers/location.handler.js";
import { sosHandler } from "./handlers/sos.handler.js";
import { groupHandler } from "./handlers/group.handler.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@stay-connected/shared";

export function setupSocketIO(httpServer: HTTPServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      pingInterval: 25000,
      pingTimeout: 20000,
    }
  );

  console.log("Using default Socket.IO adapter (single-instance mode)");

  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        phone: string;
      };
      socket.data.userId = payload.userId;
      socket.data.phone = payload.phone;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `User connected: ${socket.data.userId} (socket: ${socket.id})`
    );

    // Register handlers
    locationHandler(io, socket);
    sosHandler(io, socket);
    groupHandler(io, socket);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.data.userId}`);
    });
  });

  return io;
}
