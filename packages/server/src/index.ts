import "dotenv/config";
import express from "express";
import type { Express } from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { setupSocketIO } from "./socket/index.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import groupRoutes from "./routes/group.routes.js";
import locationRoutes from "./routes/location.routes.js";
import sosRoutes from "./routes/sos.routes.js";
import meetingRoutes from "./routes/meeting.routes.js";
import qrRoutes from "./routes/qr.routes.js";
import smsRoutes from "./routes/sms.routes.js";

const app: Express = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/meeting-points", meetingRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/sms", smsRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Setup Socket.IO
const io = setupSocketIO(httpServer);

// Start server
httpServer.listen(env.PORT, () => {
  console.log(`
  ================================================
    Stay Connected Server
    Running on: http://${env.HOST}:${env.PORT}
    Environment: ${env.NODE_ENV}
    Socket.IO: Enabled
  ================================================
  `);
});

export { app, httpServer, io };
