import { prisma } from "../config/database.js";
import { nanoid } from "nanoid";
import { INVITE_CODE_LENGTH, MAX_GROUP_SIZE } from "@stay-connected/shared";

export async function createGroup(
  userId: string,
  name: string,
  description?: string,
  eventDate?: string
) {
  const inviteCode = nanoid(INVITE_CODE_LENGTH).toUpperCase();

  const group = await prisma.group.create({
    data: {
      name,
      inviteCode,
      description,
      eventDate: eventDate ? new Date(eventDate) : undefined,
      members: {
        create: {
          userId,
          role: "ADMIN",
        },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, phone: true } } },
      },
    },
  });

  return group;
}

export async function joinGroup(
  userId: string,
  inviteCode: string,
  nickname?: string
) {
  const group = await prisma.group.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
    include: { members: true },
  });

  if (!group) {
    throw new Error("Invalid invite code");
  }

  if (!group.isActive) {
    throw new Error("Group is no longer active");
  }

  if (group.members.length >= MAX_GROUP_SIZE) {
    throw new Error("Group is full");
  }

  const existingMember = group.members.find((m) => m.userId === userId);
  if (existingMember) {
    if (existingMember.isActive) {
      throw new Error("Already a member of this group");
    }
    // Re-activate if they previously left
    await prisma.groupMember.update({
      where: { id: existingMember.id },
      data: { isActive: true, nickname },
    });
    return group;
  }

  await prisma.groupMember.create({
    data: {
      userId,
      groupId: group.id,
      nickname,
    },
  });

  return prisma.group.findUnique({
    where: { id: group.id },
    include: {
      members: {
        where: { isActive: true },
        include: { user: { select: { id: true, name: true, phone: true } } },
      },
    },
  });
}

export async function getUserGroups(userId: string) {
  return prisma.group.findMany({
    where: {
      members: { some: { userId, isActive: true } },
      isActive: true,
    },
    include: {
      members: {
        where: { isActive: true },
        include: {
          user: {
            select: { id: true, name: true, phone: true, photoUrl: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getGroup(groupId: string) {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        where: { isActive: true },
        include: {
          user: {
            select: { id: true, name: true, phone: true, photoUrl: true },
          },
        },
      },
      meetingPoints: {
        where: { isActive: true },
      },
    },
  });
}

export async function leaveGroup(userId: string, groupId: string) {
  const member = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  if (!member) {
    throw new Error("Not a member of this group");
  }

  await prisma.groupMember.update({
    where: { id: member.id },
    data: { isActive: false },
  });

  return { success: true };
}

export async function regenerateInviteCode(userId: string, groupId: string) {
  const member = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  if (!member || member.role !== "ADMIN") {
    throw new Error("Only admins can regenerate invite codes");
  }

  const newCode = nanoid(INVITE_CODE_LENGTH).toUpperCase();

  return prisma.group.update({
    where: { id: groupId },
    data: { inviteCode: newCode },
  });
}
