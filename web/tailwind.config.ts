import type { Config } from "tailwindcss";

const tokenColor = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "mercury-blue": tokenColor("--color-mercury-blue-rgb"),
        "ghost-blue": tokenColor("--color-ghost-blue-rgb"),
        "deep-space": tokenColor("--color-deep-space-rgb"),
        "midnight-slate": tokenColor("--color-midnight-slate-rgb"),
        graphite: tokenColor("--color-graphite-rgb"),
        lead: tokenColor("--color-lead-rgb"),
        starlight: tokenColor("--color-starlight-rgb"),
        silver: tokenColor("--color-silver-rgb"),
        "pure-white": tokenColor("--color-pure-white-rgb"),
        background: tokenColor("--color-deep-space-rgb"),
        foreground: tokenColor("--color-starlight-rgb"),
        primary: tokenColor("--color-mercury-blue-rgb"),
        secondary: tokenColor("--color-ghost-blue-rgb"),
        accent: tokenColor("--color-mercury-blue-rgb"),
        cyan: tokenColor("--color-ghost-blue-rgb"),
        ink: tokenColor("--color-starlight-rgb"),
        muted: tokenColor("--color-silver-rgb"),
        border: "rgb(var(--color-lead-rgb) / 0.42)"
      },
      fontFamily: {
        sans: ["Inter", "Manrope", "system-ui", "sans-serif"],
        arcadia: ["Inter", "Manrope", "system-ui", "sans-serif"],
        arcadiaDisplay: ["Inter", "Manrope", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      fontSize: {
        caption: ["12px", { lineHeight: "1.5", letterSpacing: "0.24px" }],
        "body-sm": ["14px", { lineHeight: "1.5", letterSpacing: "0.28px" }],
        body: ["16px", { lineHeight: "1.5", letterSpacing: "0.16px" }],
        subheading: ["18px", { lineHeight: "1.4" }],
        "heading-sm": ["21px", { lineHeight: "1.35" }],
        heading: ["32px", { lineHeight: "1.2" }],
        "heading-lg": ["49px", { lineHeight: "1.15" }],
        display: ["65px", { lineHeight: "1.1", letterSpacing: "0.65px" }]
      },
      boxShadow: {
        soft: "none",
        glow: "0 0 0 1px rgba(82,102,235,0.34)",
        halo: "0 0 0 1px rgba(205,221,255,0.18)"
      },
      borderRadius: {
        card: "0px",
        container: "4px",
        pill: "32px",
        "pill-lg": "40px"
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        28: "7rem",
        32: "8rem"
      }
    }
  },
  plugins: []
};

export default config;
