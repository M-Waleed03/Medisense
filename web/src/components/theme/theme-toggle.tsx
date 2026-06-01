"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      title={isLight ? "Switch to dark theme" : "Switch to light theme"}
      aria-pressed={isLight}
      onClick={toggleTheme}
      className={cn(
        "group relative inline-flex h-10 w-[4.45rem] shrink-0 items-center rounded-pill border border-ghost-blue/20 bg-ghost-blue/10 px-1.5 text-starlight backdrop-blur-xl transition hover:bg-ghost-blue/16 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className
      )}
    >
      <span className="sr-only">{isLight ? "Switch to dark theme" : "Switch to light theme"}</span>
      <span className="pointer-events-none absolute left-2 grid h-6 w-6 place-items-center text-[rgb(var(--color-silver-rgb)/0.78)]">
        <Moon className="h-3.5 w-3.5" />
      </span>
      <span className="pointer-events-none absolute right-2 grid h-6 w-6 place-items-center text-[rgb(var(--color-silver-rgb)/0.78)]">
        <Sun className="h-3.5 w-3.5" />
      </span>
      <span className="theme-toggle-thumb relative z-10 grid h-7 w-7 place-items-center rounded-full bg-primary text-pure-white">
        {isLight ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
