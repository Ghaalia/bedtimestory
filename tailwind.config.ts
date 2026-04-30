import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "ui-rounded", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-rounded", "system-ui", "sans-serif"],
      },
      colors: {
        cream: "#FFF8EE",
        moon: "#FFE9A8",
        sky: "#BFE3FF",
        lavender: "#D7C9FF",
        peach: "#FFC9B5",
        mint: "#B8F1D2",
        ink: "#2A2348",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(42, 35, 72, 0.10)",
        pop: "0 8px 0 0 rgba(42, 35, 72, 0.15)",
      },
      borderRadius: {
        blob: "32px",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        twinkle: "twinkle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
