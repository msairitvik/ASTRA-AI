import React from "react";
import { Menu, Volume2, VolumeX, ShieldCheck, Sun, Moon } from "lucide-react";

interface HeaderProps {
  onMenuToggle: () => void;
  title: string;
  subtitle?: string;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  mcpConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  title,
  subtitle,
  isSpeaking,
  onStopSpeaking,
  soundEnabled,
  onToggleSound,
  isDarkMode,
  onToggleTheme,
  mcpConnected,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-astra-surface/80 backdrop-blur-md border-b border-astra-border px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-astra-muted hover:text-white hover:bg-white/5 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-astra-muted hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Actions, Protocol Badge, Voice Control, Theme Toggle */}
      <div className="flex items-center gap-3">
        {/* Verified Protocol Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-astra-violet/10 border border-astra-violet/30 text-astra-lavender">
          <ShieldCheck className="w-3.5 h-3.5 text-astra-cyan" />
          <span>MCP Connected • Streamable HTTP</span>
        </div>

        {/* Voice Playback Toggle */}
        <button
          onClick={isSpeaking ? onStopSpeaking : onToggleSound}
          className={`p-2 rounded-xl border transition-all duration-200 ${
            isSpeaking
              ? "bg-astra-teal/20 border-astra-teal/50 text-astra-teal animate-pulse"
              : soundEnabled
              ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
              : "bg-white/5 border-white/10 text-astra-muted hover:text-white"
          }`}
          title={
            isSpeaking
              ? "Stop Speaking"
              : soundEnabled
              ? "Auto-speech Enabled (click to mute)"
              : "Auto-speech Muted (click to enable)"
          }
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-astra-violet" />
          )}
        </button>
      </div>
    </header>
  );
};
