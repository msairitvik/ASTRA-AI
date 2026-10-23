import { Router, Request, Response } from "express";
import { mcpClientManager } from "../mcp-client/client.js";
import { config, providerHealth } from "../config/index.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    await mcpClientManager.ensureConnected();
    const status = mcpClientManager.getStatus();

    res.json({
      application: "ASTRA AI Assistant",
      version: "1.0.0",
      status: "operational",
      uptimeSeconds: Math.floor(process.uptime()),
      mcp: {
        connected: status.connected,
        endpoint: status.serverUrl,
        transport: "Streamable HTTP",
        protocolVersion: status.negotiatedProtocolVersion || "2025-11-25",
        serverName: status.serverInfo?.name || "ASTRA AI Assistant",
        serverVersion: status.serverInfo?.version || "1.0.0",
        toolsCount: status.toolsCount,
        lastConnectedAt: status.lastConnectedAt,
        error: status.error,
      },
      aiProvider: {
        configured: providerHealth.configured,
        provider: providerHealth.activeProvider,
        model: providerHealth.model,
        mode: providerHealth.configured ? "cloud_llm" : "local_engine",
        lastCallSuccess: providerHealth.lastCallSuccess,
        lastError: providerHealth.lastError,
        lastErrorType: providerHealth.lastErrorType,
        lastCallTime: providerHealth.lastCallTime,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to determine server status", details: err?.message });
  }
});

export default router;
