// ============================================
// SOCKET.IO EVENT TYPE MAP
// ============================================

import type { LocationSource, MemberLocation } from "./group";
import type { SOSSeverity, MeetingPoint } from "./message";

// Client → Server events
export interface ClientToServerEvents {
  "location:update": (data: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    heading?: number;
    speed?: number;
    batteryLevel?: number;
    source: LocationSource;
    timestamp: number;
  }) => void;

  "group:join": (data: { groupId: string }) => void;
  "group:leave": (data: { groupId: string }) => void;

  "sos:trigger": (data: {
    groupId: string;
    latitude: number;
    longitude: number;
    message?: string;
    severity: SOSSeverity;
  }) => void;
  "sos:acknowledge": (data: { alertId: string }) => void;
  "sos:resolve": (data: { alertId: string }) => void;

  "mesh:relay": (data: {
    originUserId: string;
    latitude: number;
    longitude: number;
    timestamp: number;
    hopCount: number;
    groupCode: string;
  }) => void;

  "meeting:suggest": (data: {
    groupId: string;
    name: string;
    latitude: number;
    longitude: number;
  }) => void;
}

// Server → Client events
export interface ServerToClientEvents {
  "location:member-updated": (data: MemberLocation) => void;
  "location:all-members": (data: MemberLocation[]) => void;

  "sos:alert": (data: {
    alertId: string;
    senderName: string;
    senderId: string;
    latitude: number;
    longitude: number;
    message?: string;
    severity: SOSSeverity;
    distanceFromYou: number;
  }) => void;
  "sos:acknowledged": (data: {
    alertId: string;
    byName: string;
  }) => void;
  "sos:resolved": (data: { alertId: string }) => void;

  "group:member-joined": (data: {
    userId: string;
    name: string;
  }) => void;
  "group:member-left": (data: {
    userId: string;
    name: string;
  }) => void;

  "meeting:suggested": (data: MeetingPoint) => void;

  "mesh:location-received": (data: {
    originUserId: string;
    name: string;
    latitude: number;
    longitude: number;
    timestamp: number;
  }) => void;
}
