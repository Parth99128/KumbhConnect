import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../stores/authStore.ts";
import { useLocationStore } from "../stores/locationStore.ts";
import { useSOSStore } from "../stores/sosStore.ts";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@stay-connected/shared";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket() {
  if (socket) return socket;

  const token = useAuthStore.getState().token;
  if (!token) return null;

  socket = io("/", {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  // Handle incoming location updates
  socket.on("location:member-updated", (data) => {
    useLocationStore.getState().updateMemberLocation(data);
  });

  socket.on("location:all-members", (data) => {
    useLocationStore.getState().setAllMemberLocations(data);
  });

  // Handle SOS events
  socket.on("sos:alert", (data) => {
    useSOSStore.getState().addAlert({
      id: data.alertId,
      senderId: data.senderId,
      senderName: data.senderName,
      groupId: "",
      latitude: data.latitude,
      longitude: data.longitude,
      message: data.message,
      severity: data.severity,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      distanceFromYou: data.distanceFromYou,
    });

    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("SOS Alert!", {
        body: `${data.senderName} needs help! ${data.message || ""}`,
        icon: "/icons/icon-192.png",
        tag: `sos-${data.alertId}`,
      });
    }
  });

  socket.on("sos:acknowledged", (data) => {
    useSOSStore.getState().acknowledgeAlert(data.alertId);
  });

  socket.on("sos:resolved", (data) => {
    useSOSStore.getState().resolveAlert(data.alertId);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinGroup(groupId: string) {
  const s = getSocket();
  if (s) s.emit("group:join", { groupId });
}

export function leaveGroup(groupId: string) {
  const s = getSocket();
  if (s) s.emit("group:leave", { groupId });
}

export function emitLocation(data: Parameters<ClientToServerEvents["location:update"]>[0]) {
  const s = getSocket();
  if (s) s.emit("location:update", data);
}

export function emitSOS(data: Parameters<ClientToServerEvents["sos:trigger"]>[0]) {
  const s = getSocket();
  if (s) s.emit("sos:trigger", data);
}

export function emitSOSAck(alertId: string) {
  const s = getSocket();
  if (s) s.emit("sos:acknowledge", { alertId });
}
