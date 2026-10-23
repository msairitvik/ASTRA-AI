import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { config } from "../config/index.js";

export interface MCPStatus {
  connected: boolean;
  serverUrl: string;
  serverInfo?: {
    name: string;
    version?: string;
  };
  negotiatedProtocolVersion?: string;
  toolsCount: number;
  lastConnectedAt?: string;
  error?: string;
}

export interface MCPToolInfo {
  name: string;
  description?: string;
  inputSchema: any;
}

export class MCPClientManager {
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;
  private isConnecting: boolean = false;
  private cachedTools: MCPToolInfo[] = [];
  private lastStatus: MCPStatus = {
    connected: false,
    serverUrl: config.mcpServerUrl,
    toolsCount: 0,
  };

  constructor() {}

  public async connect(): Promise<boolean> {
    if (this.isConnecting) {
      return false;
    }
    this.isConnecting = true;

    try {
      console.log(`[MCP Client] Connecting to Streamable HTTP endpoint: ${config.mcpServerUrl}`);
      
      this.client = new Client(
        {
          name: "ASTRA-Web-Client",
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      this.transport = new StreamableHTTPClientTransport(
        new URL(config.mcpServerUrl)
      );

      await this.client.connect(this.transport);

      const serverVersion = this.client.getServerVersion();
      const toolsResult = await this.client.listTools();
      this.cachedTools = (toolsResult.tools || []).map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }));

      this.lastStatus = {
        connected: true,
        serverUrl: config.mcpServerUrl,
        serverInfo: {
          name: serverVersion?.name || "ASTRA AI Assistant",
          version: serverVersion?.version || "1.0.0",
        },
        negotiatedProtocolVersion: "2025-11-25",
        toolsCount: this.cachedTools.length,
        lastConnectedAt: new Date().toISOString(),
      };

      console.log(`[MCP Client] Successfully connected to MCP server! ${this.cachedTools.length} tools discovered.`);
      this.isConnecting = false;
      return true;
    } catch (err: any) {
      console.error(`[MCP Client] Connection error:`, err?.message || err);
      this.lastStatus = {
        connected: false,
        serverUrl: config.mcpServerUrl,
        toolsCount: 0,
        error: err?.message || "Failed to connect to MCP server",
      };
      this.client = null;
      this.transport = null;
      this.isConnecting = false;
      return false;
    }
  }

  public async ensureConnected(): Promise<boolean> {
    if (this.client && this.lastStatus.connected) {
      return true;
    }
    return await this.connect();
  }

  public async listTools(): Promise<MCPToolInfo[]> {
    await this.ensureConnected();
    if (!this.client) {
      return this.cachedTools;
    }
    try {
      const res = await this.client.listTools();
      this.cachedTools = (res.tools || []).map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }));
      this.lastStatus.toolsCount = this.cachedTools.length;
      return this.cachedTools;
    } catch (err) {
      console.error("[MCP Client] Error refreshing tools:", err);
      return this.cachedTools;
    }
  }

  public async callTool(name: string, args: Record<string, any> = {}): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    executionTimeMs: number;
    raw?: any;
  }> {
    const startTime = Date.now();
    const isConnected = await this.ensureConnected();
    if (!isConnected || !this.client) {
      return {
        success: false,
        error: `MCP Server at ${config.mcpServerUrl} is currently unavailable.`,
        executionTimeMs: Date.now() - startTime,
      };
    }

    try {
      console.log(`[MCP Client] Calling tool '${name}' with arguments:`, args);
      const res = await this.client.callTool({
        name,
        arguments: args,
      });

      const execTime = Date.now() - startTime;
      let parsedOutput: any = null;

      if (res.content && Array.isArray(res.content) && res.content.length > 0) {
        const textContent = res.content.find((c: any) => c.type === "text") as any;
        if (textContent && textContent.text) {
          try {
            parsedOutput = JSON.parse(textContent.text);
          } catch {
            parsedOutput = textContent.text;
          }
        }
      }

      const isToolError = res.isError === true || (parsedOutput && parsedOutput.status === "error");

      return {
        success: !isToolError,
        result: parsedOutput ?? res.content,
        error: isToolError ? (parsedOutput?.error || "Tool returned an error") : undefined,
        executionTimeMs: execTime,
        raw: res,
      };
    } catch (err: any) {
      console.error(`[MCP Client] Tool invocation error for '${name}':`, err);
      return {
        success: false,
        error: err?.message || `Failed to call MCP tool '${name}'`,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  public getStatus(): MCPStatus {
    return { ...this.lastStatus };
  }
}

export const mcpClientManager = new MCPClientManager();
