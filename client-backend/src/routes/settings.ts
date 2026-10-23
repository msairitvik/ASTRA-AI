import { Router, Request, Response } from "express";
import { mcpClientManager } from "../mcp-client/client.js";

const router = Router();

router.post("/reset", async (_req: Request, res: Response) => {
  try {
    const outcome = await mcpClientManager.callTool("reset_demo_data", {});
    if (outcome.success) {
      res.json({
        success: true,
        message: "Demo database reset to clean initial verified state.",
      });
    } else {
      res.status(500).json({ error: outcome.error || "Failed to reset demo data" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Reset demo data exception", details: err?.message });
  }
});

export default router;
