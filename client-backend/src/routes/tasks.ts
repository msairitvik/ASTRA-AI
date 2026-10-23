import { Router, Request, Response } from "express";
import { mcpClientManager } from "../mcp-client/client.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, priority, category } = req.query;
    const outcome = await mcpClientManager.callTool("list_tasks", {
      status: (status as string) || "",
      priority: (priority as string) || "",
      category: (category as string) || "",
    });

    if (outcome.success && outcome.result) {
      res.json(outcome.result);
    } else {
      res.status(500).json({ error: outcome.error || "Failed to retrieve tasks" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Tasks retrieval exception", details: err?.message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { title, description, priority, due_date, category } = req.body;
    if (!title) {
      res.status(400).json({ error: "Task title is required." });
      return;
    }

    const outcome = await mcpClientManager.callTool("create_task", {
      title,
      description: description || "",
      priority: priority || "medium",
      due_date: due_date || "",
      category: category || "general",
    });

    if (outcome.success) {
      res.status(201).json(outcome.result);
    } else {
      res.status(400).json({ error: outcome.error || "Failed to create task" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Task creation error", details: err?.message });
  }
});

router.patch("/:id/complete", async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const outcome = await mcpClientManager.callTool("complete_task", { task_id: taskId });
    if (outcome.success) {
      res.json(outcome.result);
    } else {
      res.status(404).json({ error: outcome.error || "Task not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Task completion error", details: err?.message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const outcome = await mcpClientManager.callTool("delete_task", { task_id: taskId });
    if (outcome.success) {
      res.json(outcome.result);
    } else {
      res.status(404).json({ error: outcome.error || "Task not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: "Task deletion error", details: err?.message });
  }
});

export default router;
