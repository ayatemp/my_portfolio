import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0F1117",
          surface: "#161B27",
          elevated: "#1E2436",
        },
        border: {
          subtle: "rgba(255,255,255,0.06)",
          default: "rgba(255,255,255,0.10)",
          strong: "rgba(255,255,255,0.20)",
        },
        text: {
          primary: "#F0EDE6",
          secondary: "#9090B0",
          muted: "#50507A",
        },
        accent: {
          cyan: "#6EFFD4",
          "cyan-dim": "rgba(110,255,212,0.15)",
          amber: "#FFD580",
          "amber-dim": "rgba(255,213,128,0.12)",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains)", "Menlo", "monospace"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(3.5rem, 8vw, 7rem)", { lineHeight: "1.0", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2.5rem, 5vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.75rem, 3vw, 2.75rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      },
      animation: {
        "fade-up": "fadeUp 0.8s ease forwards",
        "fade-in": "fadeIn 1s ease forwards",
        "mesh-drift": "meshDrift 12s ease-in-out infinite alternate",
        "cursor-blink": "cursorBlink 1.1s step-end infinite",
        "grain": "grain 0.4s steps(1) infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        meshDrift: {
          "0%": { transform: "translate(0%, 0%) scale(1)" },
          "50%": { transform: "translate(-3%, 2%) scale(1.05)" },
          "100%": { transform: "translate(3%, -2%) scale(0.97)" },
        },
        cursorBlink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        grain: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-2%, -3%)" },
          "20%": { transform: "translate(3%, 1%)" },
          "30%": { transform: "translate(-1%, 4%)" },
          "40%": { transform: "translate(2%, -2%)" },
          "50%": { transform: "translate(-3%, 1%)" },
          "60%": { transform: "translate(1%, 3%)" },
          "70%": { transform: "translate(-2%, -1%)" },
          "80%": { transform: "translate(3%, 2%)" },
          "90%": { transform: "translate(-1%, -3%)" },
        },
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
