import { Router, Request, Response } from "express";
import { mcpClientManager } from "../mcp-client/client.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const outcome = await mcpClientManager.callTool("list_notes", {
      category: (category as string) || "",
    });

    if (outcome.success) {
      res.json(outcome.result);
    } else {
      res.status(500).json({ error: outcome.error || "Failed to list notes" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Notes retrieval exception", details: err?.message });
  }
});

router.get("/search", async (req: Request, res: Response) => {
  try {
    const { q, category } = req.query;
    const outcome = await mcpClientManager.callTool("search_notes", {
      query: (q as string) || "",
      category: (category as string) || "",
    });

    if (outcome.success) {
      res.json(outcome.result);
    } else {
      res.status(500).json({ error: outcome.error || "Failed to search notes" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Notes search exception", details: err?.message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { title, content, category, tags, source } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: "Title and content are required for a note." });
      return;
    }

    const outcome = await mcpClientManager.callTool("create_note", {
      title,
      content,
      category: category || "general",
      tags: tags || "",
      source: source || "user",
    });

    if (outcome.success) {
      res.status(201).json(outcome.result);
    } else {
      res.status(400).json({ error: outcome.error || "Failed to create note" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Note creation error", details: err?.message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const noteId = req.params.id;
    const outcome = await mcpClientManager.callTool("delete_note", { note_id: noteId });
    if (outcome.success) {
      res.json(outcome.result);
    } else {
      res.status(404).json({ error: outcome.error || "Note not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Note deletion error", details: err?.message });
  }
});

export default router;
