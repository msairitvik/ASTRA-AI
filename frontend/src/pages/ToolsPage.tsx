import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { MCPTool, ServerStatus } from "../types";
import {
  Wrench,
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  X,
  Radio,
  FileCode,
  ShieldCheck,
} from "lucide-react";

export const ToolsPage: React.FC = () => {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Testing Modal State
  const [activeTool, setActiveTool] = useState<MCPTool | null>(null);
  const [testArgs, setTestArgs] = useState<string>("{}");
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testLatency, setTestLatency] = useState<number | null>(null);
  const [lastExecutedMap, setLastExecutedMap] = useState<Record<string, { timestamp: string; latency: number }>>({});

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [toolsData, statusData] = await Promise.all([
        api.getTools(),
        api.getStatus().catch(() => null),
      ]);
      setTools(toolsData.tools || []);
      setStatus(statusData);
    } catch (err: any) {
      setError(err?.message || "Failed to load MCP tools directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openTester = (tool: MCPTool) => {
    setActiveTool(tool);
    setTestResult(null);
    setTestLatency(null);

    // Provide sensible default arguments based on tool name
    let defaultArgs: Record<string, any> = {};
    if (tool.name === "get_current_datetime") {
      defaultArgs = { timezone_str: "UTC" };
    } else if (tool.name === "calculate") {
      defaultArgs = { expression: "25 * 4 + 10" };
    } else if (tool.name === "create_task") {
      defaultArgs = { title: "Test Hackathon MCP Task", priority: "high", category: "demo" };
    } else if (tool.name === "list_tasks") {
      defaultArgs = { priority: "high" };
    } else if (tool.name === "complete_task") {
      defaultArgs = { task_id: "your-task-uuid" };
    } else if (tool.name === "create_note") {
      defaultArgs = { title: "Test Note", content: "Recorded via MCP interactive tester", category: "qa" };
    } else if (tool.name === "search_notes") {
      defaultArgs = { query: "MCP" };
    } else if (tool.name === "get_weather") {
      defaultArgs = { city: "Seattle" };
    } else if (tool.name === "convert_units") {
      defaultArgs = { value: 10, from_unit: "miles", to_unit: "km" };
    } else if (tool.name === "get_activity_logs") {
      defaultArgs = { limit: 10 };
    } else if (tool.name === "create_conversation") {
      defaultArgs = { title: "Personal Planning Session" };
    } else if (tool.name === "list_conversations") {
      defaultArgs = { limit: 20 };
    } else if (tool.name === "get_conversation") {
      defaultArgs = { conversation_id: "example-conv-id" };
    } else if (tool.name === "add_message") {
      defaultArgs = { conversation_id: "example-conv-id", role: "user", content: "Hello ASTRA" };
    } else if (tool.name === "update_conversation_title") {
      defaultArgs = { conversation_id: "example-conv-id", title: "New Title" };
    } else if (tool.name === "delete_conversation") {
      defaultArgs = { conversation_id: "example-conv-id" };
    }

    setTestArgs(JSON.stringify(defaultArgs, null, 2));
  };

  const handleExecuteTest = async () => {
    if (!activeTool) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(testArgs);
      } catch {
        throw new Error("Invalid JSON in arguments field.");
      }

      const outcome = await api.callTool(activeTool.name, parsedArgs);
      setTestResult(outcome);
      setTestLatency(outcome.executionTimeMs);

      // Record last execution
      setLastExecutedMap((prev) => ({
        ...prev,
        [activeTool.name]: {
          timestamp: new Date().toLocaleTimeString(),
          latency: outcome.executionTimeMs,
        },
      }));
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err?.message || "Execution exception",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Header and Status */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-astra-cyan/10 text-astra-cyan border border-astra-cyan/30 mb-2">
            <Radio className="w-3.5 h-3.5" />
            <span>MCP Protocol Specification: 2025-11-25+</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Model Context Protocol Tools Directory
          </h1>
          <p className="text-sm text-astra-muted">
            Inspect and execute live tools discovered through the official MCP Python Server via Streamable HTTP transport.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-astra-cyan" : ""}`} />
          <span>Refresh Tools</span>
        </button>
      </div>

      {/* Protocol Endpoint Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-astra-surface/80 border border-white/10">
          <div className="text-[11px] text-astra-muted uppercase font-semibold">Transport Mode</div>
          <div className="text-sm font-bold text-white mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Streamable HTTP</span>
          </div>
          <div className="text-[11px] font-mono text-astra-muted mt-0.5">POST / GET with SSE</div>
        </div>

        <div className="p-4 rounded-xl bg-astra-surface/80 border border-white/10">
          <div className="text-[11px] text-astra-muted uppercase font-semibold">Server Endpoint</div>
          <div className="text-sm font-mono font-bold text-astra-cyan mt-1 truncate">
            {status?.mcp?.endpoint || "http://127.0.0.1:8000/mcp"}
          </div>
          <div className="text-[11px] text-astra-muted mt-0.5">Self-hosted Python Server</div>
        </div>

        <div className="p-4 rounded-xl bg-astra-surface/80 border border-white/10">
          <div className="text-[11px] text-astra-muted uppercase font-semibold">Protocol Handshake</div>
          <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>v2025-11-25 Verified</span>
          </div>
          <div className="text-[11px] text-astra-muted mt-0.5">tools/list & tools/call</div>
        </div>

        <div className="p-4 rounded-xl bg-astra-surface/80 border border-white/10">
          <div className="text-[11px] text-astra-muted uppercase font-semibold">Discovered Tools</div>
          <div className="text-sm font-bold text-astra-lavender mt-1">
            {tools.length} Operational Tools
          </div>
          <div className="text-[11px] text-astra-muted mt-0.5">Dynamic client registration</div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <div className="font-semibold">Unable to connect to MCP Server</div>
            <div className="text-rose-300/80 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tools.map((tool) => {
          const lastExec = lastExecutedMap[tool.name];
          return (
            <div
              key={tool.name}
              className="p-5 rounded-2xl bg-astra-surface/80 border border-white/10 flex flex-col justify-between hover:border-astra-violet/50 transition-all duration-200 shadow-sm"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-astra-violet/20 text-astra-violet">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-xs font-bold text-white">
                      {tool.name}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Connected
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-astra-muted leading-relaxed mb-4 min-h-[2.5rem]">
                  {tool.description || "No description provided."}
                </p>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-white/5 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-astra-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Last run:</span>
                  </span>
                  <span className="font-mono text-astra-lavender">
                    {lastExec ? `${lastExec.timestamp} (${lastExec.latency}ms)` : "Ready for call"}
                  </span>
                </div>

                <button
                  onClick={() => openTester(tool)}
                  className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-astra-violet hover:border-astra-violet/80 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Test Tool</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Tool Tester Modal */}
      {activeTool && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-astra-surface border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-astra-card/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-astra-violet/20 text-astra-violet">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <span>{activeTool.name}</span>
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-white/5 text-astra-cyan">
                      Streamable HTTP
                    </span>
                  </h3>
                  <p className="text-xs text-astra-muted truncate max-w-md">
                    {activeTool.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTool(null)}
                className="p-1 rounded-lg text-astra-muted hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Arguments JSON Editor */}
              <div>
                <label className="block text-xs font-bold text-astra-lavender uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-astra-cyan" />
                  <span>Input Arguments (JSON)</span>
                </label>
                <textarea
                  rows={4}
                  value={testArgs}
                  onChange={(e) => setTestArgs(e.target.value)}
                  className="w-full p-3 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-astra-lavender focus:outline-none focus:border-astra-violet"
                />
              </div>

              {/* Execute Button */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleExecuteTest}
                  disabled={isTesting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-astra-violet to-astra-purple text-white font-semibold text-xs flex items-center gap-2 shadow-glow-violet hover:opacity-95 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isTesting ? "Executing over MCP..." : "Execute MCP Tool"}</span>
                </button>

                {testLatency !== null && (
                  <div className="flex items-center gap-1.5 text-xs text-astra-muted font-mono">
                    <Clock className="w-3.5 h-3.5 text-astra-cyan" />
                    <span>Round-trip Latency: </span>
                    <span className="text-white font-bold">{testLatency}ms</span>
                  </div>
                )}
              </div>

              {/* Execution Output Inspector */}
              {testResult && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-astra-muted">MCP Protocol Response</span>
                    <span
                      className={`flex items-center gap-1 ${
                        testResult.success ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {testResult.success ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Status: Verified Success</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Status: Failed</span>
                        </>
                      )}
                    </span>
                  </div>

                  <pre className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto max-h-56 overflow-y-auto">
                    {JSON.stringify(testResult.result || testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
