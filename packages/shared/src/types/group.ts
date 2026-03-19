// ============================================
// GROUP TYPES
// ============================================

export type MemberRole = "ADMIN" | "GUARDIAN" | "MEMBER";

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  description?: string;
  eventDate?: string;
  isActive: boolean;
  createdAt: string;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: MemberRole;
  nickname?: string;
  joinedAt: string;
  isActive: boolean;
  user?: {
    id: string;
    name: string;
    phone: string;
    photoUrl?: string;
  };
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  eventDate?: string;
}

export interface JoinGroupRequest {
  inviteCode: string;
  nickname?: string;
}

export interface GroupWithDistance extends Group {
  members: (GroupMember & {
    lastLocation?: MemberLocation;
  })[];
}

export interface MemberLocation {
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  batteryLevel?: number;
  source: LocationSource;
  timestamp: number;
  distanceFromYou?: number;
}

export type LocationSource =
  | "GPS"
  | "NETWORK"
  | "BLUETOOTH"
  | "SMS"
  | "QR_KIOSK"
  | "MANUAL";
