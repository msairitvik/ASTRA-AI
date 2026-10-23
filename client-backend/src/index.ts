
import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { mcpClientManager } from "./mcp-client/client.js";

import chatRouter from "./routes/chat.js";
import toolsRouter from "./routes/tools.js";
import tasksRouter from "./routes/tasks.js";
import notesRouter from "./routes/notes.js";
import activityRouter from "./routes/activity.js";
import statusRouter from "./routes/status.js";
import settingsRouter from "./routes/settings.js";
import conversationsRouter from "./routes/conversations.js";

const app = express();

// Render provides PORT through environment variables.
// Bind to 0.0.0.0 so Render can route external requests to this service.
const PORT = Number(process.env.PORT) || config.port || 3001;
const HOST = "0.0.0.0";

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, and dev tools).
      // Existing behavior preserved.
      if (!origin) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    app: "ASTRA AI Backend-for-Frontend",
  });
});

// API routes
app.use("/api/chat", chatRouter);
app.use("/api/tools", toolsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/notes", notesRouter);
app.use("/api/activity", activityRouter);
app.use("/api/status", statusRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/conversations", conversationsRouter);

// Global error handler
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[Backend Server Error]:", err);

    res.status(500).json({
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected server error occurred."
          : err?.message,
    });
  }
);

// Start the HTTP server
const httpServer = app.listen(PORT, HOST, () => {
  console.log("=======================================================");
  console.log("🚀 ASTRA AI Client Backend (BFF) Running");
  console.log(`🌐 Host            : ${HOST}`);
  console.log(`🔌 Port            : ${PORT}`);
  console.log(`🔗 Health Check    : /api/health`);
  console.log(`🔌 MCP Endpoint    : ${config.mcpServerUrl}`);
  console.log("=======================================================");

  // Connect to the MCP server after the HTTP server starts.
  // A failed MCP connection will not prevent the API from starting.
  void mcpClientManager
    .connect()
    .then(() => {
      console.log(
        "[MCP Client] Successfully connected to the MCP server."
      );
    })
    .catch((error: unknown) => {
      console.warn(
        `[MCP Init Notice] Could not connect to ${config.mcpServerUrl}.`,
        error
      );
      console.warn(
        "[MCP Init Notice] The backend is running; MCP may reconnect on a later request."
      );
    });
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`[Backend] ${signal} received. Shutting down...`);

  httpServer.close((error) => {
    if (error) {
      console.error("[Backend] Error while closing HTTP server:", error);
      process.exit(1);
    }

    console.log("[Backend] HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
