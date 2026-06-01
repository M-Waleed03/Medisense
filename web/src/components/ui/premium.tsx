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
    <div className={cn("glass holo-border rounded-none p-5 text-starlight", className)}>
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
    <span className="inline-flex items-center gap-2 rounded-pill border border-ghost-blue/15 bg-ghost-blue/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-starlight backdrop-blur-xl">
      <Icon className="h-4 w-4" />
      {children}
    </span>
  );
}

export function AiAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dimension = size === "lg" ? "h-20 w-20" : size === "sm" ? "h-10 w-10" : "h-14 w-14";
  const icon = size === "lg" ? "h-9 w-9" : size === "sm" ? "h-5 w-5" : "h-7 w-7";
  return (
    <div className={cn("relative grid shrink-0 place-items-center rounded-[4px] border border-ghost-blue/16 bg-graphite text-starlight", dimension)}>
      <span className="absolute inset-0 rounded-[4px] bg-[radial-gradient(circle_at_35%_20%,rgba(82,102,235,0.28),transparent_42%)]" />
      <span className="absolute -inset-2 rounded-[4px] border border-primary/18 opacity-70 [animation:pulse-ring_3s_ease-out_infinite]" />
      <Bot className={cn("relative", icon)} />
    </div>
  );
}

export function MetricRing({
  value,
  label
}: {
  value: number;
  label: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = "#5266eb";
  return (
    <div className="relative grid place-items-center">
      <div
        className="grid h-28 w-28 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${color} ${clamped * 3.6}deg, rgba(112,112,125,0.24) 0deg)`
        }}
      >
        <div className="grid h-[5.8rem] w-[5.8rem] place-items-center rounded-full border border-lead/30 bg-midnight-slate/92 backdrop-blur">
          <span className="text-2xl font-medium text-starlight">{clamped}%</span>
        </div>
      </div>
      {label && <p className="mt-3 text-center text-xs font-medium uppercase tracking-[0.16em] text-silver">{label}</p>}
    </div>
  );
}

export function PulseLine({ className }: { className?: string }) {
  return (
    <svg className={cn("h-12 w-full text-ghost-blue/65", className)} viewBox="0 0 520 64" aria-hidden="true">
      <path className="heartbeat-line" d="M0 34 H104 L124 34 L139 12 L161 54 L184 25 L201 34 H520" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NeuralField({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 opacity-35", className)}
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(205,221,255,0.2) 1px, transparent 0), radial-gradient(circle at 1px 1px, rgba(82,102,235,0.16) 1px, transparent 0)",
        backgroundSize: "72px 72px, 96px 96px",
        animation: "neural-drift 28s linear infinite"
      }}
    />
  );
}

export function ScannerLoader({ label = "MEDISENSE is scanning" }: { label?: string }) {
  return (
    <div className="rounded-none border border-primary/24 bg-graphite/60 p-5 text-starlight">
      <div className="flex items-center gap-4">
        <div className="relative grid h-14 w-14 place-items-center rounded-full border border-primary/30">
          <span className="absolute inset-1 rounded-full border border-ghost-blue/25 [animation:pulse-ring_1.8s_ease-out_infinite]" />
          <Activity className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em]">{label}</p>
          <div className="mt-2 h-1.5 w-56 overflow-hidden rounded-full bg-lead/30">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ x: ["-100%", "140%"] }}
              transition={{ repeat: Infinity, duration: 1.35, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
