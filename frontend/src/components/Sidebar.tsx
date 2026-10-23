import React from "react";
import { NavLink } from "react-router-dom";
import {
  MessageSquare,
  Compass,
  Wrench,
  CheckSquare,
  FileText,
  Activity,
  Settings,
  Sparkles,
  Zap,
  Radio,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  mcpConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  mcpConnected,
}) => {
  const navItems = [
    { to: "/", label: "Home", icon: Sparkles, exact: true },
    { to: "/chat", label: "Assistant", icon: MessageSquare },
    { to: "/explore", label: "Explore", icon: Compass },
    { to: "/tasks", label: "Tasks", icon: CheckSquare },
    { to: "/notes", label: "Notes", icon: FileText },
    { to: "/tools", label: "Tools", icon: Wrench },
    { to: "/activity", label: "Activity", icon: Activity },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-astra-surface/95 backdrop-blur-xl border-r border-astra-border flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between px-6 py-5 border-b border-astra-border">
            <NavLink to="/" onClick={onClose} className="flex items-center gap-3 group">
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-astra-violet to-astra-cyan p-0.5 shadow-glow-violet transition-transform group-hover:scale-105">
                <div className="w-full h-full bg-astra-navy rounded-[7px] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-astra-cyan fill-astra-cyan" />
                </div>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-astra-lavender to-astra-cyan bg-clip-text text-transparent">
                  ASTRA AI
                </span>
                <span className="block text-[10px] text-astra-muted font-medium uppercase tracking-wider">
                  Personal AI Assistant
                </span>
              </div>
            </NavLink>

            <button
              onClick={onClose}
              className="p-1 rounded-md text-astra-muted hover:text-white hover:bg-white/5 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-astra-violet/20 to-astra-cyan/10 text-white border border-astra-violet/30 shadow-sm"
                        : "text-astra-muted hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Connection Status Card */}
        <div className="p-4 border-t border-astra-border">
          <div className="p-3 rounded-xl bg-astra-navy/80 border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-white">
                <Radio className="w-3.5 h-3.5 text-astra-cyan" />
                <span>MCP Transport</span>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${
                  mcpConnected
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    mcpConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                {mcpConnected ? "Streamable" : "Connecting"}
              </span>
            </div>

            <div className="text-[11px] text-astra-muted flex justify-between font-mono">
              <span>Spec Version</span>
              <span className="text-astra-lavender">2025-11-25</span>
            </div>
            <div className="text-[11px] text-astra-muted flex justify-between font-mono">
              <span>Endpoint</span>
              <span className="text-astra-cyan">/mcp</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
