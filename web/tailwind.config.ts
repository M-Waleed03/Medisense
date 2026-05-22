import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F6FBFF",
        foreground: "#07111F",
        primary: "#2563EB",
        secondary: "#14B8A6",
        accent: "#7C3AED",
        cyan: "#06B6D4",
        ink: "#07111F",
        muted: "#536276",
        border: "rgba(15, 23, 42, 0.1)"
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        soft: "0 24px 70px rgba(15, 23, 42, 0.11)",
        glow: "0 22px 85px rgba(37, 99, 235, 0.24)",
        halo: "0 0 0 1px rgba(255,255,255,0.72), 0 24px 80px rgba(37,99,235,0.16)"
      }
    }
  },
  plugins: []
};

export default config;
