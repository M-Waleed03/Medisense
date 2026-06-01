"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import { motion } from "framer-motion";
import { type CSSProperties, type PointerEvent, useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, BarChart3, Bot, BrainCircuit, FileScan, HeartPulse, Microscope, Radar, ShieldCheck } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { AiAvatar, Reveal } from "@/components/ui/premium";

const MedicalScene = dynamic(() => import("@/components/visuals/medical-scene").then((module) => module.MedicalScene), {
  ssr: false,
  loading: () => <div className="h-full min-h-[620px] w-full bg-deep-space" />
});

const typingPhrases = [
  "triaging symptom patterns",
  "reading CBC signals",
  "building report context",
  "preparing safe next steps"
];

const featureRows = [
  {
    icon: HeartPulse,
    title: "Symptom checker",
    text: "Structured fever, exposure, respiratory, digestive, and risk inputs flow into an AI-guided clinical assessment."
  },
  {
    icon: FileScan,
    title: "Report analyzer",
    text: "CBC uploads become extracted lab markers, trend-ready records, flags, and plain-language summaries."
  },
  {
    icon: Bot,
    title: "Medical chatbot",
    text: "A context-aware assistant answers with profile, symptom, report, and health history signals available."
  },
  {
    icon: BarChart3,
    title: "Command dashboard",
    text: "Reports, conversations, risk states, and profile completeness stay organized in one focused workspace."
  }
];

const telemetryRows = [
  ["Symptom routing", "86%"],
  ["Report extraction", "74%"],
  ["Care context", "92%"]
];

export function Landing() {
  const [typingIndex, setTypingIndex] = useState(0);
  const phrase = typingPhrases[typingIndex];

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTypingIndex((current) => (current + 1) % typingPhrases.length), 2400);
    return () => window.clearInterval(id);
  }, []);

  const stats = useMemo(() => [
    ["Diagnostic workflows", "4"],
    ["Lab markers tracked", "10+"],
    ["One care record", "Synced"]
  ], []);

  return (
    <>
      <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-deep-space">
        <div className="absolute inset-0 z-0 opacity-70">
          <MedicalScene />
        </div>
        <div className="hero-vignette absolute inset-0 z-[1]" />
        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-[1200px] flex-col justify-center px-4 py-20">
          <div className="mx-auto w-full min-w-0 max-w-4xl text-center">
            <p className="hero-reveal text-xs font-medium uppercase tracking-[0.18em] text-silver">AI healthcare command center</p>
            <h1 className="hero-reveal mt-5 font-arcadiaDisplay text-[clamp(3.4rem,9vw,6.5rem)] font-light leading-[1.03] tracking-[0.01em] text-starlight">
              MEDISENSE
            </h1>
            <p className="hero-reveal mx-auto mt-6 max-w-[22rem] text-body font-light leading-7 text-starlight sm:max-w-2xl sm:text-heading-sm sm:leading-[1.45]">
              A dark, focused AI doctor platform for symptoms, medical reports, chatbot guidance, and health history.
            </p>
            <div className="hero-reveal mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup" className={buttonStyles({ size: "lg", className: "min-w-52" })}>
                Start analysis <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className={buttonStyles({ variant: "secondary", size: "lg", className: "min-w-52" })}>
                Sign in
              </Link>
            </div>
          </div>

          <div className="hero-reveal mt-14 min-w-0">
            <HeroCommandConsole phrase={phrase} stats={stats} />
          </div>
        </div>
      </section>

      <section className="mesh bg-midnight-slate py-20 md:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-4 lg:grid-cols-[0.75fr_1fr]">
          <Reveal>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-silver">Clinical workspace</p>
              <h2 className="mt-4 font-arcadiaDisplay text-heading-lg font-light leading-[1.15] text-starlight">Everything stays in one calm diagnostic layer.</h2>
              <p className="mt-5 max-w-xl text-body leading-7 text-silver">
                MEDISENSE is designed for repeat use: fast enough for daily questions, spacious enough for sensitive health decisions, and structured enough to preserve context across devices.
              </p>
            </div>
          </Reveal>
          <div>
            {featureRows.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 0.05}>
                <motion.div whileHover={{ x: 6, rotateY: -1.4 }} className="group border-b border-lead/40 py-7 [transform-style:preserve-3d]">
                  <div className="flex gap-5">
                    <span className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-[4px] border border-ghost-blue/15 bg-graphite text-starlight">
                      <feature.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-arcadiaDisplay text-heading-sm font-light text-starlight">{feature.title}</h3>
                      <p className="mt-2 max-w-2xl text-body-sm leading-6 text-silver">{feature.text}</p>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-deep-space py-20 md:py-28">
        <div className="mx-auto max-w-[1200px] px-4">
          <Reveal>
            <div className="grid gap-12 lg:grid-cols-[1fr_0.7fr] lg:items-end">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-silver">Built for trust</p>
                <h2 className="mt-4 max-w-3xl font-arcadiaDisplay text-heading-lg font-light leading-[1.15] text-starlight">
                  Premium healthcare AI without clutter, noise, or decorative color overload.
                </h2>
              </div>
              <p className="text-body leading-7 text-silver">
                The interface uses restrained contrast, precise data sections, and one strong call-to-action accent so patient workflows feel deliberate instead of flashy.
              </p>
            </div>
          </Reveal>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              ["Firebase auth intact", "Web and mobile keep the same secure account layer."],
              ["Health data preserved", "Dashboard, reports, chat, and history remain backed by existing APIs."],
              ["Doctor-aware guidance", "Outputs stay framed as support and escalation guidance."]
            ].map(([title, text], index) => (
              <Reveal key={title} delay={index * 0.05}>
                <motion.div whileHover={{ y: -5, rotateX: 1.2 }} className="premium-console min-h-48 p-6">
                  <ShieldCheck className="h-5 w-5 text-starlight" />
                  <h3 className="mt-8 font-arcadiaDisplay text-heading-sm font-light text-starlight">{title}</h3>
                  <p className="mt-3 text-body-sm leading-6 text-silver">{text}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-midnight-slate px-4 py-20 md:py-28">
        <Reveal>
          <div className="mx-auto max-w-[1200px] border border-lead/35 bg-deep-space/70 p-8 md:p-14">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-4">
                  <AiAvatar />
                  <p className="text-sm font-medium text-silver">MEDISENSE is {phrase}</p>
                </div>
                <h2 className="mt-6 font-arcadiaDisplay text-heading-lg font-light leading-[1.15] text-starlight">
                  Open your AI doctor workspace.
                </h2>
              </div>
              <Link href="/signup" className={buttonStyles({ size: "lg", className: "w-full sm:w-auto" })}>
                Create account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function HeroCommandConsole({
  phrase,
  stats
}: {
  phrase: string;
  stats: string[][];
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (window.matchMedia("(max-width: 767px)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -7, y: x * 8 });
  }

  return (
    <div className="depth-stage mx-auto w-full max-w-5xl">
      <div className="premium-console w-full p-4 md:hidden">
        <div className="relative min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-silver">
              <BrainCircuit className="h-4 w-4 text-starlight" />
              Live AI layer
            </span>
            <span className="inline-flex items-center gap-2 rounded-pill border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-starlight">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Online
            </span>
          </div>
          <h2 className="mt-5 font-arcadiaDisplay text-heading-sm font-light leading-tight text-starlight">
            Diagnostic intelligence in real time.
          </h2>
          <p className="mt-3 text-sm leading-6 text-silver">MEDISENSE is {phrase}.</p>
          <TelemetryBars />
        </div>
      </div>

      <motion.div
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        className="premium-console console-lift hidden w-full p-4 md:block md:p-6"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div className="relative grid min-w-0 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="holo-chip min-w-0 p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-silver">
                <BrainCircuit className="h-4 w-4 text-starlight" />
                Live AI layer
              </span>
              <span className="inline-flex items-center gap-2 rounded-pill border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-starlight">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Online
              </span>
            </div>
            <h2 className="mt-5 font-arcadiaDisplay text-heading-sm font-light leading-tight text-starlight sm:text-heading">
              Diagnostic intelligence, rendered in real time.
            </h2>
            <p className="mt-3 text-sm leading-6 text-silver">MEDISENSE is {phrase}.</p>
            <TelemetryBars />
          </div>

          <div className="grid min-w-0 gap-4 md:grid-cols-[0.82fr_1fr]">
            <div className="holo-chip grid min-h-56 min-w-0 place-items-center p-5">
              <div className="relative grid h-40 w-40 place-items-center">
                <svg className="absolute inset-0 h-full w-full text-ghost-blue/35" viewBox="0 0 160 160" aria-hidden="true">
                  <circle cx="80" cy="80" r="66" fill="none" stroke="currentColor" strokeWidth="1" />
                  <circle className="rotor-ring" cx="80" cy="80" r="50" fill="none" stroke="currentColor" strokeDasharray="22 10" strokeWidth="2" />
                  <path className="rotor-ring text-primary" d="M80 18 A62 62 0 0 1 142 80" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
                </svg>
                <div className="grid h-24 w-24 place-items-center rounded-full border border-primary/25 bg-graphite/60 text-starlight">
                  <Radar className="h-9 w-9" />
                </div>
              </div>
            </div>

            <div className="grid min-w-0 gap-3">
              {stats.map(([label, value], index) => {
                const icons = [Activity, Microscope, Bot];
                const Icon = icons[index] ?? Activity;
                return (
                  <motion.div
                    key={label}
                    className="holo-chip flex min-w-0 items-center justify-between gap-4 p-4"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 4 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-[4px] border border-ghost-blue/15 bg-graphite text-starlight">
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-silver sm:text-xs">{label}</p>
                    </div>
                    <p className="font-arcadiaDisplay text-heading-sm font-light text-starlight">{value}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TelemetryBars() {
  return (
    <div className="mt-6 space-y-3">
      {telemetryRows.map(([label, width]) => (
        <div key={label}>
          <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.14em] text-silver">
            <span>{label}</span>
            <span>{width}</span>
          </div>
          <div className="data-bar h-2" style={{ "--bar-width": width } as CSSProperties} />
        </div>
      ))}
    </div>
  );
}
