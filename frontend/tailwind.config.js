/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#070c14",
          card: "#0c1220",
          elevated: "#111827",
        },
        border: {
          subtle: "#1e293b",
          active: "rgba(34,211,238,0.3)",
        },
        accent: {
          cyan: "#22d3ee",
          "cyan-dim": "rgba(34,211,238,0.15)",
        },
        danger: {
          DEFAULT: "#f43f5e",
          bg: "rgba(244,63,94,0.12)",
        },
        safe: {
          DEFAULT: "#10b981",
          bg: "rgba(16,185,129,0.12)",
        },
        warn: {
          DEFAULT: "#f59e0b",
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', "Courier New", "monospace"],
        display: ['"Bebas Neue"', "Impact", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "scan": "scan 3s linear infinite",
        "blink": "blink 1.2s step-end infinite",
        "slide-up": "slideUp 0.4s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
        "bar-fill": "barFill 1.2s ease-out forwards",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        barFill: {
          "0%": { width: "0%" },
          "100%": { width: "var(--fill-width)" },
        },
      },
    },
  },
  plugins: [],
};
