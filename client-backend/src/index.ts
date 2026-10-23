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

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or dev tools)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "ASTRA AI Backend-for-Frontend" });
});

app.use("/api/chat", chatRouter);
app.use("/api/tools", toolsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/notes", notesRouter);
app.use("/api/activity", activityRouter);
app.use("/api/status", statusRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/conversations", conversationsRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Backend Server Error]:", err);
  res.status(500).json({ error: "Internal Server Error", message: err?.message });
});

// Start Server
app.listen(config.port, config.host, async () => {
  console.log(`=======================================================`);
  console.log(` 🚀 ASTRA AI Client Backend (BFF) Running`);
  console.log(` 🌐 Server URL    : http://${config.host}:${config.port}`);
  console.log(` 🔌 MCP Endpoint  : ${config.mcpServerUrl}`);
  console.log(`=======================================================`);

  // Attempt initial background connection to MCP Server
  try {
    await mcpClientManager.connect();
  } catch (e) {
    console.warn(`[MCP Init Notice] MCP server at ${config.mcpServerUrl} is not yet reachable. Will reconnect on request.`);
  }
});
