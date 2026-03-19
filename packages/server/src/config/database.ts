import { PrismaClient } from "@prisma/client";

declare global {
  // Prevent multiple Prisma instances in development
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
