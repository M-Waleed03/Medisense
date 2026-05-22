"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import gsap from "gsap";
import Lottie from "lottie-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Bot, BrainCircuit, FileText, HeartPulse, Microscope, ShieldCheck, Sparkles, Stethoscope, Waves } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { AiAvatar, HoloPanel, NeuralField, PulseLine, Reveal, SignalBadge } from "@/components/ui/premium";

const MedicalScene = dynamic(() => import("@/components/visuals/medical-scene").then((module) => module.MedicalScene), {
  ssr: false,
  loading: () => <div className="h-[76svh] min-h-[520px] w-full animate-pulse bg-blue-50/70 md:h-[82svh]" />
});

const typingPhrases = [
  "triaging fever patterns",
  "reading CBC signals",
  "watching platelet trends",
  "preparing safe next steps"
];

const pulseAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 90,
  w: 160,
  h: 160,
  nm: "MEDISENSE pulse",
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "pulse",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [78] }, { t: 38, s: [24] }, { t: 90, s: [78] }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [80, 80, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [58, 58, 100] }, { t: 38, s: [116, 116, 100] }, { t: 90, s: [58, 58, 100] }] }
      },
      shapes: [{ ty: "gr", it: [{ ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [108, 108] } }, { ty: "fl", c: { a: 0, k: [0.14, 0.39, 0.92, 1] }, o: { a: 0, k: 28 } }, { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }] }]
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "core",
      sr: 1,
      ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [80, 80, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } },
      shapes: [{ ty: "gr", it: [{ ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [62, 62] } }, { ty: "fl", c: { a: 0, k: [0.08, 0.72, 0.65, 1] }, o: { a: 0, k: 86 } }, { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }] }]
    }
  ]
};

const featureTiles = [
  { icon: Stethoscope, title: "AI symptom scanner", text: "Guided fever, respiratory, digestive, dengue, malaria, typhoid, and risk intake with safety-first predictions." },
  { icon: FileText, title: "Report intelligence", text: "Cloudinary upload, OCR extraction, CBC marker cards, trend graphs, and clinician-friendly summaries." },
  { icon: Bot, title: "Clinical AI assistant", text: "Context-aware chat uses profile, report, and symptom history with local medical fallback when providers fail." },
  { icon: ShieldCheck, title: "Unified health identity", text: "Firebase Auth and Firestore keep profile, settings, checks, reports, and chat synced across devices." }
];

const scannerRows = [
  ["Fever pattern", "continuous", "96% signal"],
  ["Platelet trend", "falling", "urgent watch"],
  ["Exposure clue", "mosquito", "dengue path"],
  ["Next test", "CBC + NS1", "ready"]
];

export function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
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
    const id = window.setInterval(() => setTypingIndex((current) => (current + 1) % typingPhrases.length), 2200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".hero-reveal", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: "power3.out" });
      gsap.to(".float-hud", { y: -12, duration: 2.8, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: 0.18 });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const stats = useMemo(() => [
    ["Disease tracks", "5"],
    ["CBC markers", "10"],
    ["Fallback mode", "24/7"]
  ], []);

  return (
    <>
      <section ref={heroRef} className="relative isolate overflow-hidden">
        <NeuralField />
        <div className="absolute inset-0 -z-10">
          <MedicalScene />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(248,251,255,0.98)_0%,rgba(248,251,255,0.76)_42%,rgba(248,251,255,0.12)_100%)]" />
        <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl content-center px-4 py-14 md:py-18">
          <div className="max-w-3xl">
            <div className="hero-reveal">
              <SignalBadge>Premium AI healthcare operating system</SignalBadge>
            </div>
            <h1 className="hero-reveal mt-6 max-w-3xl text-balance text-5xl font-black leading-[0.94] tracking-normal text-ink sm:text-6xl md:text-7xl">
              MEDISENSE AI Doctor
            </h1>
            <p className="hero-reveal mt-6 max-w-2xl text-lg leading-8 text-muted md:text-xl">
              A cinematic medical workspace where symptoms, reports, conversations, and risk signals converge into one intelligent health cockpit.
            </p>
            <div className="hero-reveal mt-6 flex items-center gap-3 rounded-lg border border-white/80 bg-white/68 px-4 py-3 shadow-soft backdrop-blur-xl sm:w-fit">
              <AiAvatar size="sm" />
              <p className="text-sm font-bold text-slate-700">
                MEDISENSE is <span className="text-primary">{phrase}</span>
                <span className="ml-1 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full bg-primary" />
              </p>
            </div>
            <div className="hero-reveal mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={buttonStyles({ size: "lg", className: "min-w-44" })}>Start analysis <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/features" className={buttonStyles({ variant: "outline", size: "lg", className: "min-w-44" })}>Explore system</Link>
            </div>
            <div className="hero-reveal mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {stats.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/80 bg-white/72 p-4 shadow-soft backdrop-blur-xl">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-black text-ink">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-8 right-6 hidden w-[23rem] lg:block">
          <HoloPanel className="float-hud p-4">
            <div className="flex items-center gap-3">
              <AiAvatar size="sm" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Assistant preview</p>
                <p className="text-sm font-bold text-ink">Platelets are low. Check hydration, warning signs, and repeat CBC as advised.</p>
              </div>
            </div>
          </HoloPanel>
        </div>
      </section>

      <section className="border-y border-white/80 bg-white/58 py-10 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 lg:grid-cols-[0.55fr_1fr] lg:items-center">
          <Reveal>
            <div className="relative h-44 overflow-hidden rounded-lg border border-white/80 bg-white/72 shadow-soft">
              <Lottie animationData={pulseAnimation} loop className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2" />
              <HeartPulse className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-primary" />
              <PulseLine className="absolute inset-x-5 bottom-4" />
            </div>
          </Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Firebase sync", "One account across web and mobile"],
              ["FastAPI intelligence", "Symptoms, OCR, reports, chatbot"],
              ["Safety fallback", "Local rules stay available"]
            ].map(([title, text], index) => (
              <Reveal key={title} delay={index * 0.06}>
                <HoloPanel className="h-full">
                  <p className="font-black text-ink">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
                </HoloPanel>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-16 md:grid-cols-2 xl:grid-cols-4">
        {featureTiles.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 0.06}>
            <motion.div whileHover={{ y: -6, rotateX: 2 }} transition={{ type: "spring", stiffness: 240, damping: 18 }}>
              <HoloPanel className="h-full min-h-64">
                <feature.icon className="mb-6 h-7 w-7 text-primary" />
                <h3 className="text-lg font-black text-ink">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{feature.text}</p>
              </HoloPanel>
            </motion.div>
          </Reveal>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <HoloPanel className="overflow-hidden p-0">
            <div className="border-b border-white/80 bg-white/68 p-5">
              <SignalBadge icon="pulse">Interactive scanner preview</SignalBadge>
              <h2 className="mt-4 text-3xl font-black text-ink">From symptom signals to action-ready guidance</h2>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {scannerRows.map(([label, value, status]) => (
                <div key={label} className="rounded-lg border border-white/80 bg-white/74 p-4 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
                  <p className="mt-2 text-xl font-black text-ink">{value}</p>
                  <p className="mt-1 text-sm font-bold text-primary">{status}</p>
                </div>
              ))}
            </div>
          </HoloPanel>
        </Reveal>
        <Reveal delay={0.08}>
          <HoloPanel className="relative overflow-hidden">
            <NeuralField className="opacity-30" />
            <div className="relative">
              <Microscope className="mb-5 h-8 w-8 text-secondary" />
              <h2 className="text-3xl font-black text-ink">Real data, cinematic feedback</h2>
              <p className="mt-4 leading-7 text-muted">
                Completed workflows write to Firestore collections that power synchronized dashboards, charts, history, recommendations, and the mobile app.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <MiniSignal icon={BrainCircuit} label="Neural context" />
                <MiniSignal icon={Waves} label="Live graph layer" />
              </div>
            </div>
          </HoloPanel>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-lg border border-white/80 bg-ink p-8 text-white shadow-halo md:p-10">
            <NeuralField className="opacity-20" />
            <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <SignalBadge icon="bot">Launch MEDISENSE</SignalBadge>
                <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-normal md:text-5xl">A premium AI healthcare cockpit, ready for real patient workflows.</h2>
              </div>
              <Link href="/signup" className={buttonStyles({ size: "lg", className: "bg-white text-ink hover:bg-blue-50" })}>Open workspace <Sparkles className="h-4 w-4" /></Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

function MiniSignal({ icon: Icon, label }: { icon: typeof BrainCircuit; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/80 bg-white/74 p-3 shadow-sm">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-sm font-black text-ink">{label}</span>
    </div>
  );
}
