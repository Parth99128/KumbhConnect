import { Router } from "express";
import * as authService from "../services/auth.service.js";

const router: Router = Router();

router.post("/register", async (req, res) => {
  try {
    const { phone, name, language } = req.body;
    if (!phone || !name) {
      res.status(400).json({ error: "Phone and name are required" });
      return;
    }
    const result = await authService.register(phone, name, language);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      res.status(400).json({ error: "Phone and OTP are required" });
      return;
    }
    const result = await authService.verifyOTP(phone, otp);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/device-login", async (req, res) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) {
      res.status(400).json({ error: "Device ID is required" });
      return;
    }
    const result = await authService.deviceLogin(deviceId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
