"use client";

import { motion } from "framer-motion";
import { Activity, Bot, CircleAlert, HeartPulse, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function PremiumPage({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("cinematic-bg min-h-screen", className)}>{children}</div>;
}

export function Reveal({
  children,
  delay = 0,
  className
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HoloPanel({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass holo-border rounded-lg p-5", className)}>
      {children}
    </div>
  );
}

export function SignalBadge({
  children,
  icon = "spark"
}: {
  children: React.ReactNode;
  icon?: "spark" | "pulse" | "bot" | "alert";
}) {
  const Icon = icon === "pulse" ? HeartPulse : icon === "bot" ? Bot : icon === "alert" ? CircleAlert : Sparkles;
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-white/80 bg-white/74 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-primary shadow-sm backdrop-blur-xl">
      <Icon className="h-4 w-4" />
      {children}
    </span>
  );
}

export function AiAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dimension = size === "lg" ? "h-20 w-20" : size === "sm" ? "h-10 w-10" : "h-14 w-14";
  const icon = size === "lg" ? "h-9 w-9" : size === "sm" ? "h-5 w-5" : "h-7 w-7";
  return (
    <div className={cn("relative grid shrink-0 place-items-center rounded-lg bg-gradient-to-br from-white via-blue-50 to-cyan-50 text-primary shadow-halo", dimension)}>
      <span className="absolute inset-0 rounded-lg border border-white/80" />
      <span className="absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_35%_20%,rgba(255,255,255,0.9),transparent_38%),linear-gradient(135deg,rgba(37,99,235,0.16),rgba(20,184,166,0.14))]" />
      <span className="absolute -inset-2 rounded-lg border border-primary/20 opacity-70 [animation:pulse-ring_2.8s_ease-out_infinite]" />
      <Bot className={cn("relative", icon)} />
    </div>
  );
}

export function MetricRing({
  value,
  label,
  tone = "blue"
}: {
  value: number;
  label: string;
  tone?: "blue" | "teal" | "violet" | "amber";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = tone === "teal" ? "#14B8A6" : tone === "violet" ? "#7C3AED" : tone === "amber" ? "#F59E0B" : "#2563EB";
  return (
    <div className="relative grid place-items-center">
      <div
        className="grid h-28 w-28 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${color} ${clamped * 3.6}deg, rgba(226,232,240,0.74) 0deg)`
        }}
      >
        <div className="grid h-[5.8rem] w-[5.8rem] place-items-center rounded-full bg-white/86 shadow-inner backdrop-blur">
          <span className="text-2xl font-black text-ink">{clamped}%</span>
        </div>
      </div>
      <p className="mt-3 text-center text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}

export function PulseLine({ className }: { className?: string }) {
  return (
    <svg className={cn("h-12 w-full text-primary", className)} viewBox="0 0 520 64" aria-hidden="true">
      <path className="heartbeat-line" d="M0 34 H104 L124 34 L139 12 L161 54 L184 25 L201 34 H520" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NeuralField({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 opacity-50", className)}
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(37,99,235,0.32) 1px, transparent 0), radial-gradient(circle at 1px 1px, rgba(20,184,166,0.22) 1px, transparent 0)",
        backgroundSize: "72px 72px, 96px 96px",
        animation: "neural-drift 28s linear infinite"
      }}
    />
  );
}

export function ScannerLoader({ label = "MEDISENSE is scanning" }: { label?: string }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-blue-50/70 p-5 text-primary">
      <div className="flex items-center gap-4">
        <div className="relative grid h-14 w-14 place-items-center rounded-full border border-primary/30">
          <span className="absolute inset-1 rounded-full border border-cyan/40 [animation:pulse-ring_1.8s_ease-out_infinite]" />
          <Activity className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em]">{label}</p>
          <div className="mt-2 h-1.5 w-56 overflow-hidden rounded-full bg-white/80">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary via-cyan to-secondary"
              animate={{ x: ["-100%", "140%"] }}
              transition={{ repeat: Infinity, duration: 1.35, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
