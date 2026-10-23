import {
  ChatMessage,
  Task,
  Note,
  Activity,
  ProductivitySummary,
  MCPTool,
  ServerStatus,
  ToolCallInfo,
  Conversation,
  ConversationDetail,
} from "../types";

const API_BASE = "/api";

export const api = {
  // Chat
  async sendMessage(
    message: string,
    conversationId?: string,
    clientTimezone?: string,
    clientLocation?: string,
    history?: { role: string; content: string }[]
  ): Promise<{
    conversationId: string;
    message: string;
    source: "mcp_tool" | "llm_provider" | "builtin_engine";
    providerName?: string;
    toolCall?: ToolCallInfo;
    suggestedFollowUps?: string[];
    dataPayload?: any;
  }> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        conversationId,
        clientTimezone,
        clientLocation,
        history,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to process message (HTTP ${res.status})`);
    }
    return res.json();
  },

  // Conversations (Persistent History)
  async getConversations(): Promise<Conversation[]> {
    const res = await fetch(`${API_BASE}/conversations`);
    if (!res.ok) throw new Error("Failed to fetch conversations");
    return res.json();
  },

  async getConversation(id: string): Promise<ConversationDetail> {
    const res = await fetch(`${API_BASE}/conversations/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error("Failed to fetch conversation details");
    return res.json();
  },

  async createConversation(title?: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Failed to create conversation");
    return res.json();
  },

  async renameConversation(id: string, title: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error("Failed to rename conversation");
    return res.json();
  },

  async deleteConversation(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/conversations/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete conversation");
    return true;
  },

  // Status
  async getStatus(): Promise<ServerStatus> {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) {
      throw new Error(`Failed to fetch server status (HTTP ${res.status})`);
    }
    return res.json();
  },

  // Tools
  async getTools(): Promise<{ tools: MCPTool[]; count: number; connected: boolean; protocolVersion: string; serverUrl: string }> {
    const res = await fetch(`${API_BASE}/tools`);
    if (!res.ok) {
      throw new Error(`Failed to list tools (HTTP ${res.status})`);
    }
    return res.json();
  },

  async callTool(name: string, args: Record<string, any> = {}): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    executionTimeMs: number;
    raw?: any;
  }> {
    const res = await fetch(`${API_BASE}/tools/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, arguments: args }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Tool call failed (HTTP ${res.status})`);
    }
    return res.json();
  },

  // Tasks
  async getTasks(filters?: { status?: string; priority?: string; category?: string }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.category) params.append("category", filters.category);

    const url = `${API_BASE}/tasks${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch tasks");
    const data = await res.json();
    return data.tasks || [];
  },

  async createTask(data: {
    title: string;
    description?: string;
    priority?: string;
    due_date?: string;
    category?: string;
  }): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create task");
    }
    const json = await res.json();
    return json.task;
  },

  async completeTask(id: string): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/${id}/complete`, {
      method: "PATCH",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to complete task");
    }
    const json = await res.json();
    return json.task;
  },

  async deleteTask(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Failed to delete task");
    }
    return true;
  },

  // Notes
  async getNotes(category?: string): Promise<Note[]> {
    const url = `${API_BASE}/notes${category ? `?category=${encodeURIComponent(category)}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch notes");
    const data = await res.json();
    return data.notes || [];
  },

  async searchNotes(q: string, category?: string): Promise<Note[]> {
    const params = new URLSearchParams({ q });
    if (category) params.append("category", category);
    const res = await fetch(`${API_BASE}/notes/search?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to search notes");
    const data = await res.json();
    return data.notes || [];
  },

  async createNote(data: {
    title: string;
    content: string;
    category?: string;
    tags?: string;
    source?: string;
  }): Promise<Note> {
    const res = await fetch(`${API_BASE}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create note");
    }
    const json = await res.json();
    return json.note;
  },

  async deleteNote(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete note");
    return true;
  },

  // Activity & Productivity
  async getActivity(limit: number = 50, filterType?: string): Promise<{
    activities: Activity[];
    count: number;
    summary: ProductivitySummary;
    connected: boolean;
  }> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (filterType) params.append("filter_type", filterType);
    const res = await fetch(`${API_BASE}/activity?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch activities");
    return res.json();
  },

  // Settings
  async resetDemoData(): Promise<boolean> {
    const res = await fetch(`${API_BASE}/settings/reset`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to reset demo data");
    return true;
  },
};
