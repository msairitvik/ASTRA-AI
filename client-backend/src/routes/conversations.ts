import { Router, Request, Response } from "express";
import { mcpClientManager } from "../mcp-client/client.js";

const router = Router();

// GET /api/conversations - List all saved conversations
router.get("/", async (_req: Request, res: Response) => {
  try {
    const outcome = await mcpClientManager.callTool("list_conversations", {});
    if (outcome.success) {
      res.json(outcome.result?.conversations || []);
    } else {
      res.status(500).json({ error: outcome.error || "Failed to list conversations" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to list conversations", details: err?.message });
  }
});

// POST /api/conversations - Create a new conversation session
router.post("/", async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const outcome = await mcpClientManager.callTool("create_conversation", {
      title: title || "New Conversation",
    });
    if (outcome.success) {
      res.status(201).json(outcome.result?.conversation);
    } else {
      res.status(500).json({ error: outcome.error || "Failed to create conversation" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create conversation", details: err?.message });
  }
});

// GET /api/conversations/:id - Retrieve conversation and all its messages
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.id;
    const outcome = await mcpClientManager.callTool("get_conversation", {
      conversation_id: conversationId,
    });
    if (outcome.success && outcome.result?.conversation) {
      res.json(outcome.result.conversation);
    } else {
      res.status(404).json({ error: outcome.error || "Conversation not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch conversation", details: err?.message });
  }
});

// PATCH /api/conversations/:id - Rename a conversation
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.id;
    const { title } = req.body;
    if (!title || typeof title !== "string") {
      res.status(400).json({ error: "Title is required" });
      return;
    }
    const outcome = await mcpClientManager.callTool("update_conversation_title", {
      conversation_id: conversationId,
      title: title.trim(),
    });
    if (outcome.success) {
      res.json(outcome.result?.conversation);
    } else {
      res.status(404).json({ error: outcome.error || "Conversation not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to rename conversation", details: err?.message });
  }
});

// DELETE /api/conversations/:id - Delete a conversation and its messages
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.id;
    const outcome = await mcpClientManager.callTool("delete_conversation", {
      conversation_id: conversationId,
    });
    if (outcome.success) {
      res.json({ success: true, message: "Conversation deleted" });
    } else {
      res.status(404).json({ error: outcome.error || "Conversation not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete conversation", details: err?.message });
  }
});

export default router;
