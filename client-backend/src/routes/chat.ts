import { Router, Request, Response } from "express";
import { AssistantService } from "../services/assistant.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { message, conversationId, clientTimezone, clientLocation, history } = req.body;
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Missing or invalid 'message' in request body." });
      return;
    }

    const response = await AssistantService.processMessage(
      message,
      conversationId,
      clientTimezone,
      clientLocation,
      Array.isArray(history) ? history : []
    );
    res.json(response);
  } catch (err: any) {
    console.error("[Route /api/chat] Error:", err);
    res.status(500).json({
      error: "Internal server error processing assistant request",
      details: err?.message || err,
    });
  }
});

export default router;
