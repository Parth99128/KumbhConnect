// ============================================
// AUTH TYPES
// ============================================

export interface User {
  id: string;
  phone: string;
  name: string;
  photoUrl?: string;
  deviceId?: string;
  language: string;
  lastSeenAt: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  phone: string;
  name: string;
  language?: string;
  deviceId?: string;
}

export interface VerifyOTPRequest {
  phone: string;
  otp: string;
}

export interface DeviceLoginRequest {
  deviceId: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
