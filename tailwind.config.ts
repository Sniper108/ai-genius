import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        void: "#05060a",
        panel: "rgba(18, 21, 33, 0.6)",
        // agent accent palette
        claude: "#ff7a45",
        electric: "#7c5cff",
        cyan: "#22d3ee",
        lime: "#a3e635",
        rose: "#fb7185",
        amber: "#fbbf24",
      },
      boxShadow: {
        glow: "0 0 40px -8px var(--tw-shadow-color)",
        "glow-lg": "0 0 80px -12px var(--tw-shadow-color)",
        inset: "inset 0 1px 0 0 rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        "grid-lines":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.7" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate(0%, 0%) rotate(0deg)" },
          "33%": { transform: "translate(6%, -8%) rotate(40deg)" },
          "66%": { transform: "translate(-6%, 6%) rotate(-30deg)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.1,0.5,0.5,1) infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.2s infinite",
        aurora: "aurora 22s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
