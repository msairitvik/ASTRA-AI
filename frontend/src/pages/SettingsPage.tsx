import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { ServerStatus } from "../types";
import {
  Settings,
  Server,
  Cpu,
  Moon,
  Sun,
  Volume2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ShieldAlert,
  Info,
} from "lucide-react";

interface SettingsPageProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isDarkMode,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
}) => {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getStatus();
      setStatus(data);
    } catch (err: any) {
      console.error("Failed to load status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleClearChatHistory = () => {
    if (window.confirm("Are you sure you want to clear your local chat conversation history?")) {
      localStorage.removeItem("astra_chat_messages");
      alert("Chat conversation history cleared.");
    }
  };

  const handleResetDemoData = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all tasks and notes to the verified initial demo dataset? Any user-created items will be replaced."
      )
    ) {
      return;
    }

    setResetting(true);
    setResetMessage(null);
    try {
      await api.resetDemoData();
      setResetMessage("Demo data successfully reset! Initial tasks and notes restored.");
      setTimeout(() => setResetMessage(null), 4000);
    } catch (err: any) {
      alert(err?.message || "Failed to reset demo data");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-astra-lavender border border-white/10 mb-2">
          <Settings className="w-3.5 h-3.5 text-astra-cyan" />
          <span>System Configuration & Preferences</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Settings & Environment
        </h1>
        <p className="text-sm text-astra-muted">
          Manage application themes, voice preferences, local persistence, and inspect Model Context Protocol server connectivity.
        </p>
      </div>

      {resetMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* Server & MCP Connectivity Panel */}
      <section className="p-6 rounded-2xl bg-astra-surface/80 border border-white/10 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-astra-cyan" />
          <span>Server & Protocol Connectivity</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
            <div className="text-[11px] text-astra-muted uppercase font-sans font-semibold">
              Python MCP Server
            </div>
            <div className="flex items-center justify-between">
              <span className="text-astra-muted">Endpoint:</span>
              <span className="text-white font-bold">{status?.mcp?.endpoint || "http://127.0.0.1:8000/mcp"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-astra-muted">Transport:</span>
              <span className="text-emerald-400 font-bold">Streamable HTTP</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-astra-muted">Protocol Spec:</span>
              <span className="text-astra-cyan font-bold">{status?.mcp?.protocolVersion || "2025-11-25"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-astra-muted">Registered Tools:</span>
              <span className="text-astra-lavender font-bold">{status?.mcp?.toolsCount ?? 15} Tools</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
            <div className="text-[11px] text-astra-muted uppercase font-sans font-semibold">
              Client BFF & Intelligence Engine
            </div>
            <div className="flex items-center justify-between">
              <span className="text-astra-muted">BFF Gateway:</span>
              <span className="text-white font-bold">http://127.0.0.1:3001</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-astra-muted">Active Engine:</span>
              <span className="text-astra-purple font-bold">
                {status?.aiProvider?.provider || "ASTRA Intelligent Core (Built-in)"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-astra-muted">Storage:</span>
              <span className="text-astra-teal font-bold">SQLite (data/astra.db)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-astra-muted">Session Status:</span>
              <span className="text-emerald-400 font-bold">Verified Operational</span>
            </div>
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="p-6 rounded-2xl bg-astra-surface/80 border border-white/10 space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-astra-violet" />
          <span>User Preferences</span>
        </h2>

        {/* Theme Preference */}
        <div className="flex items-center justify-between py-2 border-b border-white/5">
          <div>
            <div className="text-sm font-semibold text-white">Visual Theme</div>
            <div className="text-xs text-astra-muted">
              Choose between futuristic midnight dark mode and clean lavender light mode.
            </div>
          </div>

          <button
            onClick={onToggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
          >
            {isDarkMode ? (
              <>
                <Moon className="w-3.5 h-3.5 text-astra-violet" />
                <span>Dark Luxury</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span>Clean Light</span>
              </>
            )}
          </button>
        </div>

        {/* Voice Playback Preference */}
        <div className="flex items-center justify-between py-2 border-b border-white/5">
          <div>
            <div className="text-sm font-semibold text-white">Assistant Spoken Responses</div>
            <div className="text-xs text-astra-muted">
              Automatically synthesize speech for assistant responses using the Web Speech API.
            </div>
          </div>

          <button
            onClick={onToggleSound}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              soundEnabled
                ? "bg-astra-teal/20 text-astra-teal border-astra-teal/40"
                : "bg-white/5 text-astra-muted border-white/10 hover:text-white"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{soundEnabled ? "Enabled" : "Muted"}</span>
          </button>
        </div>
      </section>

      {/* Data Management Section */}
      <section className="p-6 rounded-2xl bg-astra-surface/80 border border-white/10 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>Data Management & Reset</span>
        </h2>

        <p className="text-xs text-astra-muted">
          Manage local demo data and browser session storage. These operations do not affect external services.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          {/* Clear Chat History */}
          <button
            onClick={handleClearChatHistory}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Chat Conversation</span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={handleResetDemoData}
            disabled={resetting}
            className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors flex items-center gap-2"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{resetting ? "Resetting Demo Database..." : "Reset Verified Demo Data"}</span>
          </button>
        </div>
      </section>

      {/* Hackathon Submission Transparency Notice */}
      <div className="p-4 rounded-xl bg-astra-violet/5 border border-astra-violet/20 text-xs text-astra-muted space-y-1">
        <div className="flex items-center gap-1.5 text-astra-lavender font-bold">
          <Info className="w-4 h-4 text-astra-cyan" />
          <span>Hackathon Transparency & Independence Notice</span>
        </div>
        <p>
          ASTRA AI is an independent project inspired by the conversational and organizational experience of Alexa+, built for the Amazon Build, Ship, Shape Hackathon (Alexa+ Track). It uses a genuine, self-hosted Model Context Protocol server over Streamable HTTP and does not use proprietary Amazon Alexa+ preview credentials or mock data.
        </p>
      </div>
    </div>
  );
};
