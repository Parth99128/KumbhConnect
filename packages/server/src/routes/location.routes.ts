import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import * as locationService from "../services/location.service.js";

const router: Router = Router();

router.use(authMiddleware);

// Get all member locations for a group
router.get("/group/:groupId", async (req, res) => {
  try {
    const locations = await locationService.getGroupMemberLocations(
      req.params.groupId
    );
    res.json(locations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific member's location
router.get("/member/:userId", async (req, res) => {
  try {
    const location = await locationService.getCurrentLocation(
      req.params.userId
    );
    if (!location) {
      res.status(404).json({ error: "No location found for this member" });
      return;
    }
    res.json(location);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Batch upload queued offline locations
router.post("/bulk", async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      res.status(400).json({ error: "Entries array is required" });
      return;
    }
    const result = await locationService.bulkUploadLocations(
      req.user!.userId,
      entries
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
