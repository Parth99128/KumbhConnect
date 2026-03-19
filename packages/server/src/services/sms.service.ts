import { prisma } from "../config/database.js";
import {
  haversineDistance,
  formatDistance,
} from "@stay-connected/shared";
import * as locationService from "./location.service.js";

/**
 * SMS Command Handler for non-smartphone users.
 * Processes incoming SMS commands and returns text responses.
 *
 * Commands:
 *   JOIN <code>       - Join a group
 *   LOC              - Report location (from cell tower)
 *   LOC <lat> <lng>  - Report exact location
 *   SOS              - Trigger emergency
 *   SOS <message>    - Trigger SOS with message
 *   WHERE <name>     - Get member location
 *   MEET             - Get nearest meeting point
 *   STATUS           - Get all member distances
 *   LANG HI          - Switch language
 */
export async function handleSMSCommand(
  phone: string,
  body: string,
  cellLatitude?: number,
  cellLongitude?: number
): Promise<string> {
  const parts = body.trim().toUpperCase().split(/\s+/);
  const command = parts[0];

  // Find or create session
  let session = await prisma.sMSSession.findFirst({
    where: {
      phone,
      expiresAt: { gt: new Date() },
    },
  });

  if (!session) {
    session = await prisma.sMSSession.create({
      data: {
        phone,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });
  }

  // Find user by phone
  const user = await prisma.user.findUnique({ where: { phone } });

  switch (command) {
    case "JOIN": {
      if (!parts[1]) return "Usage: JOIN <invite-code>";
      const code = parts[1];
      const group = await prisma.group.findUnique({
        where: { inviteCode: code },
      });
      if (!group) return "Invalid invite code. Please check and try again.";

      if (!user) {
        return "Please register first at our website or ask a volunteer with a smartphone to register you.";
      }

      // Check if already member
      const existing = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: user.id, groupId: group.id } },
      });
      if (existing?.isActive) return `You are already in group "${group.name}".`;

      if (!existing) {
        await prisma.groupMember.create({
          data: { userId: user.id, groupId: group.id },
        });
      } else {
        await prisma.groupMember.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
      }

      // Save session group context
      await prisma.sMSSession.update({
        where: { id: session.id },
        data: { groupId: group.id },
      });

      return `Joined group "${group.name}" successfully! Send STATUS to see your group members.`;
    }

    case "LOC": {
      if (!user) return "Not registered. Please register first.";
      const lat = parts[1] ? parseFloat(parts[1]) : cellLatitude;
      const lng = parts[2] ? parseFloat(parts[2]) : cellLongitude;

      if (!lat || !lng) {
        return "Could not determine your location. Try: LOC 25.4321 81.8765";
      }

      await locationService.updateLocation(user.id, {
        latitude: lat,
        longitude: lng,
        accuracy: parts[1] ? 10 : 500, // GPS vs cell tower
        source: parts[1] ? "MANUAL" : "SMS",
        timestamp: Date.now(),
      });

      return `Location updated! Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    }

    case "SOS": {
      if (!user) return "Not registered. Please register first.";
      const message = parts.slice(1).join(" ") || "Emergency via SMS";

      // Find user's groups
      const memberships = await prisma.groupMember.findMany({
        where: { userId: user.id, isActive: true },
        include: { group: true },
      });

      if (memberships.length === 0) return "You are not in any group. JOIN a group first.";

      // Trigger SOS for all groups
      for (const m of memberships) {
        await prisma.sOSAlert.create({
          data: {
            senderId: user.id,
            groupId: m.groupId,
            latitude: cellLatitude ?? 0,
            longitude: cellLongitude ?? 0,
            message,
            severity: "HIGH",
          },
        });
      }

      return `SOS SENT to ${memberships.length} group(s)! Your group members have been alerted. Stay where you are.`;
    }

    case "WHERE": {
      if (!user) return "Not registered.";
      if (!parts[1]) return "Usage: WHERE <member-name>";
      const searchName = parts.slice(1).join(" ");

      // Search across user's groups
      const myGroups = await prisma.groupMember.findMany({
        where: { userId: user.id, isActive: true },
      });
      const groupIds = myGroups.map((g) => g.groupId);

      const members = await prisma.groupMember.findMany({
        where: {
          groupId: { in: groupIds },
          isActive: true,
          user: { name: { contains: searchName, mode: "insensitive" } },
        },
        include: { user: { select: { id: true, name: true } } },
      });

      if (members.length === 0) return `No member found matching "${searchName}".`;

      const results: string[] = [];
      for (const member of members) {
        const loc = await locationService.getCurrentLocation(member.userId);
        if (loc) {
          const age = Math.round((Date.now() - loc.timestamp) / 60000);
          results.push(`${member.user.name}: Lat ${loc.latitude.toFixed(4)}, Lng ${loc.longitude.toFixed(4)} (${age}min ago)`);
        } else {
          results.push(`${member.user.name}: Location unknown`);
        }
      }

      return results.join("\n");
    }

    case "STATUS": {
      if (!user) return "Not registered.";

      const groups = await prisma.groupMember.findMany({
        where: { userId: user.id, isActive: true },
        include: {
          group: {
            include: {
              members: {
                where: { isActive: true },
                include: { user: { select: { id: true, name: true } } },
              },
            },
          },
        },
      });

      if (groups.length === 0) return "You are not in any group.";

      const myLoc = await locationService.getCurrentLocation(user.id);
      const lines: string[] = [];

      for (const gm of groups) {
        lines.push(`[${gm.group.name}]`);
        for (const member of gm.group.members) {
          if (member.userId === user.id) continue;
          const memberLoc = await locationService.getCurrentLocation(member.userId);
          if (memberLoc && myLoc) {
            const dist = haversineDistance(
              myLoc.latitude, myLoc.longitude,
              memberLoc.latitude, memberLoc.longitude
            );
            lines.push(`  ${member.user.name}: ${formatDistance(dist)}`);
          } else {
            lines.push(`  ${member.user.name}: Location unknown`);
          }
        }
      }

      return lines.join("\n");
    }

    default:
      return `Unknown command "${command}".\nCommands: JOIN, LOC, SOS, WHERE, STATUS, MEET`;
  }
}
