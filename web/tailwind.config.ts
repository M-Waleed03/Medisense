import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        foreground: "#0F172A",
        primary: "#3B82F6",
        secondary: "#14B8A6",
        accent: "#8B5CF6",
        border: "rgba(15, 23, 42, 0.1)"
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        soft: "0 18px 60px rgba(15, 23, 42, 0.10)",
        glow: "0 20px 80px rgba(59, 130, 246, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
