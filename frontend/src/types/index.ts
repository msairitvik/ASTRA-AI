export type OrbState = "idle" | "listening" | "processing" | "speaking";

export interface ToolCallInfo {
  name: string;
  arguments: Record<string, any>;
  result: any;
  executionTimeMs: number;
  success: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  source?: "mcp_tool" | "llm_provider" | "builtin_engine";
  providerName?: string;
  toolCall?: ToolCallInfo;
  suggestedFollowUps?: string[];
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed";
  due_date?: string | null;
  category: string;
  created_at: string;
  completed_at?: string | null;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags?: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  type: string;
  tool_name?: string | null;
  status: "success" | "failure" | "info";
  details: string;
  timestamp: string;
}

export interface ProductivitySummary {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  completion_rate_percent: number;
  total_notes: number;
  recent_activity_count: number;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: any;
}

export interface ServerStatus {
  application: string;
  version: string;
  status: string;
  uptimeSeconds: number;
  mcp: {
    connected: boolean;
    endpoint: string;
    transport: string;
    protocolVersion: string;
    serverName: string;
    serverVersion: string;
    toolsCount: number;
    lastConnectedAt?: string;
    error?: string;
  };
  aiProvider: {
    configured: boolean;
    provider: string;
    mode: string;
  };
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface StoredMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tool_call?: string | null;
  tool_result?: string | null;
  created_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: StoredMessage[];
}
