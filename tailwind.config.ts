import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Space Grotesk", "sans-serif"],
        tech: ["var(--font-tech)", "JetBrains Mono", "monospace"],
      },
      colors: {
        night: "var(--night)",
        "night-soft": "var(--night-soft)",
        "night-alt": "var(--night-alt)",
        snow: "var(--snow)",
        "neon-pink": "var(--neon-pink)",
        "neon-cyan": "var(--neon-cyan)",
        "neon-violet": "var(--neon-violet)",
        flare: "var(--flare)",
        aqua: "var(--aqua)",
      },
      animation: {
        pulseGlow: "pulseGlow 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 25px rgba(255, 79, 216, 0.4)" },
          "50%": { boxShadow: "0 0 55px rgba(77, 255, 241, 0.55)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-15px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
