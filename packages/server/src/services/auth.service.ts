import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import type { AuthPayload } from "../middleware/auth.js";

// In production, use a proper OTP service. Here we simulate OTP.
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function register(phone: string, name: string, language = "en") {
  let user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    user = await prisma.user.create({
      data: { phone, name, language },
    });
  }

  const otp = generateOTP();
  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  // In production: send OTP via SMS using Twilio
  console.log(`[DEV] OTP for ${phone}: ${otp}`);

  return { userId: user.id, message: "OTP sent" };
}

export async function verifyOTP(phone: string, otp: string) {
  // BYPASS OTP for Development / Easy Access
  if (otp === "000000") {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new Error("User not found");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });

    const tokens = generateTokens({ userId: user.id, phone: user.phone });

    return {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        photoUrl: user.photoUrl,
        language: user.language,
        lastSeenAt: user.lastSeenAt.toISOString(),
        createdAt: user.createdAt.toISOString(),
      },
      tokens,
    };
  }

  const stored = otpStore.get(phone);

  if (!stored || stored.expiresAt < Date.now()) {
    throw new Error("OTP expired or not found");
  }

  if (stored.otp !== otp) {
    throw new Error("Invalid OTP");
  }

  otpStore.delete(phone);

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    throw new Error("User not found");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastSeenAt: new Date() },
  });

  const tokens = generateTokens({ userId: user.id, phone: user.phone });

  return {
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      photoUrl: user.photoUrl,
      language: user.language,
      lastSeenAt: user.lastSeenAt.toISOString(),
      createdAt: user.createdAt.toISOString(),
    },
    tokens,
  };
}

export async function deviceLogin(deviceId: string) {
  let user = await prisma.user.findUnique({ where: { deviceId } });

  if (!user) {
    throw new Error("Device not registered");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastSeenAt: new Date() },
  });

  const tokens = generateTokens({ userId: user.id, phone: user.phone });

  return {
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      photoUrl: user.photoUrl,
      language: user.language,
      lastSeenAt: user.lastSeenAt.toISOString(),
      createdAt: user.createdAt.toISOString(),
    },
    tokens,
  };
}

function generateTokens(payload: AuthPayload) {
  const jwtSecret: Secret = env.JWT_SECRET;

  const accessToken = jwt.sign(payload, jwtSecret, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
  const refreshToken = jwt.sign(payload, jwtSecret, {
    expiresIn: "30d",
  });
  return { accessToken, refreshToken };
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
