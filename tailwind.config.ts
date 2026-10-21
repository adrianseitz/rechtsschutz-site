import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1.25rem", md: "2rem" }, screens: { "2xl": "1200px" } },
    extend: {
      colors: {
        // "navy" = Markenschwarz (Tinte), "teal" = Signalgelb – Namen bleiben für Kompatibilität
        navy: {
          DEFAULT: "#0B0B0A",
          950: "#050505",
          900: "#0B0B0A",
          800: "#1C1C1A",
          700: "#2E2E2B",
          600: "#4A4A46",
          100: "#EDEDE8",
          50: "#F5F5F1",
        },
        teal: {
          DEFAULT: "#FFD60A",
          700: "#7A6000",
          600: "#E6BE00",
          500: "#FFD60A",
          400: "#FFE14D",
          100: "#FFF1A8",
          50: "#FFF9DB",
        },
        sun: { DEFAULT: "#FFD60A", soft: "#FFF4BF", wash: "#FFFBE8", deep: "#E6BE00" },
        surface: "#FAFAF7",
        paper: "#F4F3EE",
        ink: { DEFAULT: "#0B0B0A", soft: "#45453F", muted: "#71716B" },
        line: "#E6E5DF",
      },
      fontFamily: {
        sans: ['"Geist Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        display: ['"Geist Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ['"Instrument Serif"', "ui-serif", "Georgia", "serif"],
        mono: ['"Geist Mono Variable"', "ui-monospace", "monospace"],
        hand: ['"Caveat Variable"', "cursive"],
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem", "3xl": "1.75rem" },
      boxShadow: {
        card: "0 1px 0 rgba(11,11,10,0.04)",
        lift: "0 1px 2px rgba(11,11,10,0.04), 0 24px 48px -24px rgba(11,11,10,0.22)",
        glow: "0 0 0 5px rgba(255,214,10,0.35)",
      },
      letterSpacing: { tightest: "-0.045em", tighter2: "-0.03em" },
      keyframes: {
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
      },
      animation: { float: "float 6s ease-in-out infinite", marquee: "marquee 38s linear infinite", spin_slow: "spin 22s linear infinite" },
    },
  },
  plugins: [],
};
export default config;
