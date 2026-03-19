import { Router } from "express";
import * as smsService from "../services/sms.service.js";

const router: Router = Router();

// Twilio webhook for incoming SMS
router.post("/incoming", async (req, res) => {
  try {
    const { From: phone, Body: body } = req.body;

    if (!phone || !body) {
      res.status(400).json({ error: "Missing phone or body" });
      return;
    }

    const response = await smsService.handleSMSCommand(phone, body);

    // Return TwiML response for Twilio
    res.type("text/xml").send(`
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Message>${escapeXml(response)}</Message>
      </Response>
    `);
  } catch (err: any) {
    res.type("text/xml").send(`
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Message>An error occurred. Please try again.</Message>
      </Response>
    `);
  }
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default router;
