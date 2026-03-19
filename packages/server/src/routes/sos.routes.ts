import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import * as sosService from "../services/sos.service.js";

const router: Router = Router();

router.use(authMiddleware);

router.post("/", async (req, res) => {
  try {
    const { groupId, latitude, longitude, severity, message } = req.body;
    if (!groupId || latitude == null || longitude == null) {
      res.status(400).json({ error: "groupId, latitude, longitude required" });
      return;
    }
    const alert = await sosService.triggerSOS(
      req.user!.userId,
      groupId,
      latitude,
      longitude,
      severity,
      message
    );
    res.status(201).json(alert);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/group/:groupId", async (req, res) => {
  try {
    const alerts = await sosService.getActiveSOSForGroup(req.params.groupId);
    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id/acknowledge", async (req, res) => {
  try {
    const result = await sosService.acknowledgeSOS(
      req.params.id,
      req.user!.userId
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id/resolve", async (req, res) => {
  try {
    const alert = await sosService.resolveSOS(req.params.id);
    res.json(alert);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
