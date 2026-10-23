import React from "react";
import { OrbState } from "../types";

interface OrbProps {
  state?: OrbState;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
  showBadge?: boolean;
}

export const Orb: React.FC<OrbProps> = ({
  state = "idle",
  size = "md",
  className = "",
  onClick,
  showBadge = true,
}) => {
  const sizeMap = {
    sm: "w-16 h-16",
    md: "w-28 h-28",
    lg: "w-44 h-44",
    xl: "w-64 h-64",
  };

  const badgeConfig = {
    idle: {
      text: "Astra Ready",
      color: "bg-astra-violet/20 text-astra-lavender border-astra-violet/30",
      dot: "bg-astra-violet",
    },
    listening: {
      text: "Listening...",
      color: "bg-astra-cyan/20 text-astra-cyan border-astra-cyan/40",
      dot: "bg-astra-cyan animate-ping",
    },
    processing: {
      text: "Thinking...",
      color: "bg-astra-purple/20 text-purple-300 border-astra-purple/40",
      dot: "bg-astra-purple animate-pulse",
    },
    speaking: {
      text: "Speaking...",
      color: "bg-astra-teal/20 text-astra-teal border-astra-teal/40",
      dot: "bg-astra-teal animate-bounce",
    },
  };

  const currentBadge = badgeConfig[state];

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Orb Container */}
      <div
        onClick={onClick}
        className={`relative ${sizeMap[size]} flex items-center justify-center cursor-pointer transition-transform duration-500 hover:scale-105 active:scale-95`}
        title={`Astra AI Orb (${currentBadge.text})`}
      >
        {/* Layer 1: Ambient Backdrop Glow */}
        <div
          className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
            state === "listening"
              ? "bg-gradient-to-tr from-astra-cyan via-teal-400 to-astra-violet opacity-75 scale-125"
              : state === "processing"
              ? "bg-gradient-to-tr from-astra-purple via-pink-500 to-astra-violet opacity-80 scale-120 animate-pulse"
              : state === "speaking"
              ? "bg-gradient-to-tr from-astra-teal via-astra-cyan to-astra-lavender opacity-75 scale-125"
              : "bg-gradient-to-tr from-astra-violet via-purple-600 to-astra-cyan opacity-40 scale-100 animate-pulse-slow"
          }`}
        />

        {/* Layer 2: Outer Pulse Wave Ring (for Listening & Speaking) */}
        {(state === "listening" || state === "speaking") && (
          <div
            className={`absolute -inset-4 rounded-full border border-astra-cyan/50 animate-ping opacity-50 pointer-events-none ${
              state === "speaking" ? "border-astra-teal/60 duration-1000" : "duration-700"
            }`}
          />
        )}

        {/* Layer 3: Rotating Energy Corona SVG */}
        <svg
          viewBox="0 0 100 100"
          className={`absolute inset-0 w-full h-full pointer-events-none ${
            state === "processing" ? "animate-spin" : "animate-orb-spin"
          }`}
          style={{ animationDuration: state === "processing" ? "3s" : "25s" }}
        >
          <defs>
            <linearGradient id="orbGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#A855F7" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="orbGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="url(#orbGrad1)"
            strokeWidth="1.5"
            strokeDasharray="40 10 20 15"
            className="opacity-70"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="url(#orbGrad2)"
            strokeWidth="1"
            strokeDasharray="15 35 25 10"
            className="opacity-50"
          />
        </svg>

        {/* Layer 4: Main Shimmering Orb Body */}
        <div
          className={`relative w-[85%] h-[85%] rounded-full overflow-hidden shadow-glow-orb backdrop-blur-md transition-all duration-500 animate-orb-float ${
            state === "listening"
              ? "ring-2 ring-astra-cyan/80 ring-offset-2 ring-offset-astra-navy"
              : state === "processing"
              ? "ring-2 ring-astra-purple/80 ring-offset-2 ring-offset-astra-navy"
              : state === "speaking"
              ? "ring-2 ring-astra-teal/80 ring-offset-2 ring-offset-astra-navy"
              : "ring-1 ring-white/20"
          }`}
          style={{
            background:
              state === "listening"
                ? "radial-gradient(circle at 35% 35%, #67e8f9 0%, #06b6d4 40%, #1e1b4b 85%)"
                : state === "processing"
                ? "radial-gradient(circle at 35% 35%, #d8b4fe 0%, #a855f7 40%, #090b1a 85%)"
                : state === "speaking"
                ? "radial-gradient(circle at 35% 35%, #99f6e4 0%, #14b8a6 45%, #0f172a 85%)"
                : "radial-gradient(circle at 35% 35%, #c084fc 0%, #7c3aed 35%, #1e1b4b 75%, #090b1a 100%)",
          }}
        >
          {/* Surface Specular Highlight */}
          <div className="absolute top-[10%] left-[18%] w-[35%] h-[25%] rounded-full bg-white/40 blur-[2px] transform -rotate-12 pointer-events-none" />

          {/* Internal Swirling Waveforms */}
          <div
            className={`absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent ${
              state === "processing"
                ? "animate-pulse"
                : state === "listening"
                ? "animate-bounce"
                : "opacity-40"
            }`}
          />
        </div>
      </div>

      {/* State Badge Pill */}
      {showBadge && (
        <div
          className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md transition-all duration-300 ${currentBadge.color}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${currentBadge.dot}`} />
          <span>{currentBadge.text}</span>
        </div>
      )}
    </div>
  );
};
