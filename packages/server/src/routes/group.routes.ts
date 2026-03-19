import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import * as groupService from "../services/group.service.js";

const router: Router = Router();

router.use(authMiddleware);

router.post("/", async (req, res) => {
  try {
    const { name, description, eventDate } = req.body;
    if (!name) {
      res.status(400).json({ error: "Group name is required" });
      return;
    }
    const group = await groupService.createGroup(
      req.user!.userId,
      name,
      description,
      eventDate
    );
    res.status(201).json(group);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const groups = await groupService.getUserGroups(req.user!.userId);
    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const group = await groupService.getGroup(req.params.id);
    if (!group) {
      res.status(404).json({ error: "Group not found" });
      return;
    }
    res.json(group);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/join", async (req, res) => {
  try {
    const { inviteCode, nickname } = req.body;
    if (!inviteCode) {
      res.status(400).json({ error: "Invite code is required" });
      return;
    }
    const group = await groupService.joinGroup(
      req.user!.userId,
      inviteCode,
      nickname
    );
    res.json(group);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id/leave", async (req, res) => {
  try {
    const result = await groupService.leaveGroup(
      req.user!.userId,
      req.params.id
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/:id/invite-code", async (req, res) => {
  try {
    const group = await groupService.regenerateInviteCode(
      req.user!.userId,
      req.params.id
    );
    res.json({ inviteCode: group.inviteCode });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
