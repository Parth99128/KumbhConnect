import { prisma } from "../config/database.js";
import QRCode from "qrcode";
import { nanoid } from "nanoid";

/**
 * Generate a QR code for a wristband.
 * The QR encodes: SC:<wristband_id>
 * This is printed on a waterproof wristband for people without smartphones.
 */
export async function generateWristband(
  userId: string,
  assignedName: string,
  emergencyPhone: string
) {
  const wristbandCode = `SC:${nanoid(8).toUpperCase()}`;

  const wristband = await prisma.wristband.create({
    data: {
      qrCode: wristbandCode,
      userId,
      assignedName,
      emergencyPhone,
    },
  });

  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(wristbandCode, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
  });

  return {
    ...wristband,
    qrDataUrl,
  };
}

/**
 * Handle a QR wristband scan.
 * Updates the person's location based on the scanner's GPS position.
 */
export async function scanWristband(
  qrCode: string,
  scannerLatitude: number,
  scannerLongitude: number
) {
  const wristband = await prisma.wristband.findUnique({
    where: { qrCode },
    include: {
      user: {
        include: {
          memberships: {
            where: { isActive: true },
            include: {
              group: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!wristband) {
    throw new Error("Invalid wristband QR code");
  }

  if (!wristband.isActive) {
    throw new Error("Wristband is deactivated");
  }

  // Update wristband location
  await prisma.wristband.update({
    where: { id: wristband.id },
    data: {
      lastScannedAt: new Date(),
      lastLatitude: scannerLatitude,
      lastLongitude: scannerLongitude,
    },
  });

  // Also create a location history entry for the person
  await prisma.locationHistory.create({
    data: {
      userId: wristband.userId,
      latitude: scannerLatitude,
      longitude: scannerLongitude,
      source: "QR_KIOSK",
      timestamp: new Date(),
    },
  });

  return {
    assignedName: wristband.assignedName,
    emergencyPhone: wristband.emergencyPhone,
    groups: wristband.user.memberships.map((m) => m.group),
    message: `Location updated for ${wristband.assignedName}`,
  };
}

export async function lookupWristband(qrCode: string) {
  const wristband = await prisma.wristband.findUnique({
    where: { qrCode },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          memberships: {
            where: { isActive: true },
            include: {
              group: { select: { id: true, name: true, inviteCode: true } },
            },
          },
        },
      },
    },
  });

  if (!wristband) {
    throw new Error("Invalid wristband QR code");
  }

  return wristband;
}
