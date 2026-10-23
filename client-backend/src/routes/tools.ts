import { Router, Request, Response } from "express";
import { mcpClientManager } from "../mcp-client/client.js";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const tools = await mcpClientManager.listTools();
    const status = mcpClientManager.getStatus();
    res.json({
      tools,
      count: tools.length,
      connected: status.connected,
      protocolVersion: status.negotiatedProtocolVersion || "2025-11-25",
      serverUrl: status.serverUrl,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to list MCP tools", details: err?.message });
  }
});

router.post("/call", async (req: Request, res: Response) => {
  try {
    const { name, arguments: args } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Missing 'name' of tool to call." });
      return;
    }

    const outcome = await mcpClientManager.callTool(name, args || {});
    res.json(outcome);
  } catch (err: any) {
    res.status(500).json({ error: "Tool invocation failed", details: err?.message });
  }
});

export default router;
