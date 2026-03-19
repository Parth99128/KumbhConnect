import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import * as qrService from "../services/qr.service.js";

const router: Router = Router();

router.use(authMiddleware);

router.post("/generate", async (req, res) => {
  try {
    const { assignedName, emergencyPhone } = req.body;
    if (!assignedName || !emergencyPhone) {
      res.status(400).json({ error: "assignedName and emergencyPhone required" });
      return;
    }
    const wristband = await qrService.generateWristband(
      req.user!.userId,
      assignedName,
      emergencyPhone
    );
    res.status(201).json(wristband);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/scan", async (req, res) => {
  try {
    const { qrCode, latitude, longitude } = req.body;
    if (!qrCode || latitude == null || longitude == null) {
      res.status(400).json({ error: "qrCode, latitude, longitude required" });
      return;
    }
    const result = await qrService.scanWristband(qrCode, latitude, longitude);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/wristband/:code", async (req, res) => {
  try {
    const wristband = await qrService.lookupWristband(req.params.code);
    res.json(wristband);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

export default router;
