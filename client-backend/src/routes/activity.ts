import { Router, Request, Response } from "express";
import { mcpClientManager } from "../mcp-client/client.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { limit, filter_type } = req.query;
    const numLimit = limit ? parseInt(limit as string, 10) : 50;

    const [logsOutcome, summaryOutcome] = await Promise.all([
      mcpClientManager.callTool("get_activity_logs", {
        limit: numLimit,
        filter_type: (filter_type as string) || "",
      }),
      mcpClientManager.callTool("get_productivity_summary", {}),
    ]);

    res.json({
      activities: logsOutcome.result?.activities || [],
      count: logsOutcome.result?.count || 0,
      summary: summaryOutcome.result?.summary || {},
      connected: logsOutcome.success,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve activity logs", details: err?.message });
  }
});

export default router;
