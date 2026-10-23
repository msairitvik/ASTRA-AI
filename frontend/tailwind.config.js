/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        astra: {
          navy: "#090B1A",
          surface: "#0D1127",
          card: "#121736",
          indigo: "#171A3B",
          violet: "#8B5CF6",
          purple: "#A855F7",
          cyan: "#22D3EE",
          teal: "#2DD4BF",
          lavender: "#E9D5FF",
          white: "#F8FAFC",
          muted: "#94A3B8",
          border: "rgba(255, 255, 255, 0.08)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        "glow-violet": "0 0 30px -5px rgba(139, 92, 246, 0.4)",
        "glow-cyan": "0 0 30px -5px rgba(34, 211, 238, 0.4)",
        "glow-orb": "0 0 50px 10px rgba(168, 85, 247, 0.35)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "orb-float": "orbFloat 6s ease-in-out infinite",
        "orb-spin": "spin 20s linear infinite",
      },
      keyframes: {
        orbFloat: {
          "0%, 100%": { transform: "translateY(0px) scale(1)" },
          "50%": { transform: "translateY(-8px) scale(1.02)" },
        },
      },
    },
  },
  plugins: [],
};
