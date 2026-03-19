// ============================================
// MESSAGE / SOS TYPES
// ============================================

export type SOSSeverity = "LOW" | "MEDIUM" | "HIGH";
export type SOSStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED" | "EXPIRED";

export interface SOSAlert {
  id: string;
  senderId: string;
  senderName: string;
  groupId: string;
  latitude: number;
  longitude: number;
  message?: string;
  severity: SOSSeverity;
  status: SOSStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  distanceFromYou?: number;
}

export interface TriggerSOSRequest {
  groupId: string;
  latitude: number;
  longitude: number;
  message?: string;
  severity: SOSSeverity;
}

export interface MeetingPoint {
  id: string;
  groupId?: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  type: MeetingPointType;
  isActive: boolean;
  distanceFromYou?: number;
}

export type MeetingPointType =
  | "PREDEFINED"
  | "SUGGESTED"
  | "EMERGENCY"
  | "LANDMARK";

export interface WristbandInfo {
  id: string;
  qrCode: string;
  userId: string;
  assignedName: string;
  emergencyPhone: string;
  isActive: boolean;
  lastScannedAt?: string;
  lastLatitude?: number;
  lastLongitude?: number;
}
