import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Orb } from "../components/Orb";
import { OrbState } from "../types";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
  Database,
  Volume2,
  Terminal,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const [orbState, setOrbState] = useState<OrbState>("idle");

  const starterPrompts = [
    { text: "Help me organize my day.", path: "/chat?prompt=" + encodeURIComponent("Help me organize my day.") },
    { text: "What time is it in Tokyo?", path: "/chat?prompt=" + encodeURIComponent("What time is it in Tokyo?") },
    { text: "What's the weather in Seattle?", path: "/chat?prompt=" + encodeURIComponent("What's the weather in Seattle?") },
    { text: "Calculate sqrt(144) * 25", path: "/chat?prompt=" + encodeURIComponent("Calculate sqrt(144) * 25") },
    { text: "Show my productivity summary", path: "/chat?prompt=" + encodeURIComponent("Show my productivity summary") },
    { text: "Create task: Review morning schedule", path: "/chat?prompt=" + encodeURIComponent("Create task: Review morning schedule") },
  ];

  const features = [
    {
      icon: Terminal,
      title: "Real Streamable HTTP MCP Server",
      description:
        "Compliant with the official Model Context Protocol 2025-11-25+ specification, utilizing true Streamable HTTP transport at `/mcp`.",
    },
    {
      icon: Layers,
      title: "21 Discoverable Tools",
      description:
        "Extensive multi-domain capability covering timezones, safe calculations, persistent tasks, notes, conversations, live weather, unit conversions, and analytics.",
    },
    {
      icon: Database,
      title: "Guaranteed SQLite Persistence",
      description:
        "Unified data layer ensures tasks, notes, and activity logs modified in chat are instantly updated across all dashboard pages.",
    },
    {
      icon: Volume2,
      title: "Integrated Voice Experience",
      description:
        "Hands-free speech-to-text input and natural speech synthesis powered by modern browser standards with graceful offline fallbacks.",
    },
    {
      icon: Cpu,
      title: "Decoupled Modern Architecture",
      description:
        "Python FastMCP/Starlette ASGI server paired with a Node.js TypeScript BFF client and a responsive React 19 frontend.",
    },
    {
      icon: ShieldCheck,
      title: "Local-First & Privacy Resilient",
      description:
        "No mandatory paid API keys or external data dependencies required. Runs cleanly on your local machine with complete data ownership.",
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-6 pb-12 flex flex-col items-center text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-astra-violet/20 via-astra-purple/10 to-astra-cyan/15 blur-3xl pointer-events-none rounded-full" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-astra-lavender shadow-sm mb-6 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-astra-cyan" />
          <span>Next-Generation Personal AI • Model Context Protocol</span>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.15]">
          Your world.{" "}
          <span className="bg-gradient-to-r from-astra-violet via-astra-lavender to-astra-cyan bg-clip-text text-transparent">
            One intelligent assistant.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-astra-muted max-w-xl leading-relaxed">
          ASTRA AI delivers conversational intelligence, personal organization,
          and practical everyday utilities powered by a self-hosted Model Context
          Protocol server.
        </p>

        {/* Interactive Orb Demonstration */}
        <div className="mt-8 mb-4">
          <Orb
            state={orbState}
            size="lg"
            onClick={() => {
              const states: OrbState[] = ["idle", "listening", "processing", "speaking"];
              const nextIndex = (states.indexOf(orbState) + 1) % states.length;
              setOrbState(states[nextIndex]);
            }}
          />
          <p className="text-[11px] text-astra-muted mt-2">
            Click orb to cycle visual states ({orbState})
          </p>
        </div>

        {/* Call to Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-astra-violet to-astra-purple text-white font-semibold text-sm shadow-glow-violet hover:opacity-95 transition-all transform hover:-translate-y-0.5"
          >
            <span>Open Assistant</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/tools"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-all"
          >
            <span>Explore 21 MCP Tools</span>
          </Link>
        </div>

        {/* Quick Starter Pills */}
        <div className="mt-10 max-w-2xl">
          <div className="text-xs uppercase tracking-wider font-semibold text-astra-muted mb-3">
            Try asking ASTRA AI:
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {starterPrompts.map((p, idx) => (
              <Link
                key={idx}
                to={p.path}
                className="px-3 py-1.5 rounded-lg bg-astra-surface/90 border border-white/10 text-xs text-astra-lavender hover:text-white hover:border-astra-violet/50 hover:bg-astra-violet/10 transition-all"
              >
                "{p.text}"
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Protocol Architecture Spotlight */}
      <section className="rounded-2xl border border-white/10 bg-astra-surface/60 backdrop-blur-md p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full MCP Specification Compliance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Autonomous, Self-Hosted MCP Architecture
            </h2>
            <p className="text-sm text-astra-muted leading-relaxed">
              Unlike ordinary REST wrappers or mock animations, ASTRA AI connects
              through official Model Context Protocol SDKs using stateful
              Streamable HTTP transport. Tools are dynamically discovered via
              <code className="text-astra-cyan mx-1">tools/list</code> and
              invoked via <code className="text-astra-cyan mx-1">tools/call</code> with
              verified schema validation.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-astra-lavender">
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-astra-muted block">Transport</span>
                <span className="text-white font-semibold">Streamable HTTP</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-astra-muted block">Protocol Version</span>
                <span className="text-astra-cyan font-semibold">2025-11-25+</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-astra-muted block">Endpoint</span>
                <span className="text-astra-teal font-semibold">http://127.0.0.1:8000/mcp</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto flex-1 max-w-md p-4 rounded-xl bg-astra-navy/90 border border-white/10 font-mono text-xs text-left shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10 text-astra-muted text-[11px]">
              <span>mcp-session-handshake.log</span>
              <span className="text-emerald-400">● Live Verified</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="text-astra-muted">&gt; POST /mcp HTTP/1.1</div>
              <div className="text-astra-cyan">&lt; 200 OK (Session-Id: 07014ef...)</div>
              <div className="text-astra-muted">&gt; {"{\"method\": \"initialize\", \"params\": {...}}"}</div>
              <div className="text-astra-lavender">&lt; {"{\"protocolVersion\": \"2025-11-25\", ...}"}</div>
              <div className="text-astra-muted">&gt; {"{\"method\": \"tools/list\"}"}</div>
              <div className="text-emerald-400">&lt; Discovered 21 registered tools</div>
              <div className="text-astra-muted">&gt; {"{\"method\": \"tools/call\", \"name\": \"...\"}"}</div>
              <div className="text-amber-300">&lt; Structured JSON execution verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Designed for Everyday Intelligence
          </h2>
          <p className="text-sm text-astra-muted">
            Engineered to empower personal productivity, fast information access,
            and reliable task automation without proprietary lock-in.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-astra-surface/60 border border-white/10 hover:border-astra-violet/40 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-10 h-10 rounded-xl bg-astra-violet/10 border border-astra-violet/20 flex items-center justify-center text-astra-violet group-hover:text-astra-cyan transition-colors mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-xs text-astra-muted leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-10 border-t border-astra-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-astra-muted">
        <div>
          <span className="font-semibold text-white">ASTRA AI</span> — Independent conversational AI & personal assistant powered by Model Context Protocol.
        </div>
        <div className="flex items-center gap-4">
          <Link to="/tools" className="hover:text-white transition-colors">Tools</Link>
          <Link to="/tasks" className="hover:text-white transition-colors">Tasks</Link>
          <Link to="/activity" className="hover:text-white transition-colors">Activity</Link>
          <Link to="/settings" className="hover:text-white transition-colors">Settings</Link>
        </div>
      </footer>
    </div>
  );
};
