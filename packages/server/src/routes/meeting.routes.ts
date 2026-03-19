import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import * as meetingService from "../services/meeting.service.js";

const router: Router = Router();

router.get("/predefined", async (_req, res) => {
  try {
    const points = await meetingService.getPredefinedMeetingPoints();
    res.json(points);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.use(authMiddleware);

router.get("/group/:groupId", async (req, res) => {
  try {
    const points = await meetingService.getGroupMeetingPoints(
      req.params.groupId
    );
    res.json(points);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { groupId, name, latitude, longitude } = req.body;
    if (!groupId || !name || latitude == null || longitude == null) {
      res.status(400).json({ error: "groupId, name, latitude, longitude required" });
      return;
    }
    const point = await meetingService.suggestMeetingPoint(
      groupId,
      name,
      latitude,
      longitude,
      req.user!.userId
    );
    res.status(201).json(point);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/suggest-optimal", async (req, res) => {
  try {
    const { groupId } = req.body;
    if (!groupId) {
      res.status(400).json({ error: "groupId is required" });
      return;
    }
    const point = await meetingService.suggestOptimalMeetingPoint(groupId);
    res.json(point);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
