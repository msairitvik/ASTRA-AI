import React, { useState } from "react";
import { ToolCallInfo } from "../types";
import { Terminal, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface ToolResultCardProps {
  toolCall: ToolCallInfo;
}

export const ToolResultCard: React.FC<ToolResultCardProps> = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);

  const { name, arguments: args, result, executionTimeMs, success } = toolCall;

  return (
    <div className="my-2.5 rounded-xl border border-white/10 bg-astra-surface/90 overflow-hidden text-xs shadow-md transition-all duration-200 hover:border-astra-violet/40">
      {/* Header Bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-3.5 py-2.5 bg-astra-card/60 cursor-pointer select-none border-b border-white/5"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-astra-violet/20 text-astra-violet">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono font-semibold text-astra-lavender">
            {name}
          </span>
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-astra-muted">
            MCP Streamable HTTP
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-astra-muted text-[11px]">
            <Clock className="w-3 h-3" />
            <span>{executionTimeMs}ms</span>
          </div>

          <div
            className={`flex items-center gap-1 font-medium px-2 py-0.5 rounded-full ${
              success
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            {success ? (
              <>
                <CheckCircle className="w-3 h-3" />
                <span>Verified</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                <span>Failed</span>
              </>
            )}
          </div>

          <button className="text-astra-muted hover:text-white transition-colors">
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Protocol Payload Inspector */}
      {expanded && (
        <div className="p-3 bg-astra-navy/90 border-t border-white/5 space-y-2 font-mono">
          {/* Tool Arguments */}
          <div>
            <div className="text-[10px] text-astra-cyan font-bold uppercase tracking-wider mb-1">
              Input Arguments
            </div>
            <pre className="p-2 rounded bg-black/40 text-[11px] text-astra-lavender/90 overflow-x-auto border border-white/5">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>

          {/* Tool Return Value */}
          <div>
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">
              MCP Returned Output
            </div>
            <pre className="p-2 rounded bg-black/40 text-[11px] text-emerald-300/90 overflow-x-auto border border-white/5 max-h-48 overflow-y-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
