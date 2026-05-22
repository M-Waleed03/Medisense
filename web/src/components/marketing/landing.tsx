"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import gsap from "gsap";
import Lottie from "lottie-react";
import { useEffect, useRef } from "react";
import { ArrowRight, Bot, FileText, HeartPulse, Microscope, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const MedicalScene = dynamic(() => import("@/components/visuals/medical-scene").then((module) => module.MedicalScene), {
  ssr: false,
  loading: () => <div className="h-[460px] w-full animate-pulse bg-blue-50/80 md:h-[620px]" />
});

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
        o: { a: 1, k: [{ t: 0, s: [74] }, { t: 38, s: [24] }, { t: 90, s: [74] }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [80, 80, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [62, 62, 100] }, { t: 38, s: [104, 104, 100] }, { t: 90, s: [62, 62, 100] }] }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [108, 108] } },
            { ty: "fl", c: { a: 0, k: [0.23, 0.51, 0.96, 1] }, o: { a: 0, k: 26 } },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
          ]
        }
      ]
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "core",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [80, 80, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            { ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [64, 64] } },
            { ty: "fl", c: { a: 0, k: [0.08, 0.72, 0.65, 1] }, o: { a: 0, k: 88 } },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
          ]
        }
      ]
    }
  ]
};

const metrics = [
  { label: "Symptoms routed", value: "5 disease tracks" },
  { label: "Report vision", value: "10 CBC markers" },
  { label: "Fallback safety", value: "Local rules online" }
];

const features = [
  { icon: Stethoscope, title: "AI symptom scanner", text: "Structured fever, respiratory, digestive, dengue, malaria, typhoid, and risk-factor intake saved to Firestore." },
  { icon: FileText, title: "Report intelligence", text: "Cloudinary uploads, OCR extraction, CBC flags, trend graphs, and conservative medical interpretation." },
  { icon: Bot, title: "Resilient chatbot", text: "Provider-ready responses with a local medical fallback so users never see raw quota or provider failures." },
  { icon: ShieldCheck, title: "Shared identity", text: "Firebase Auth and Firestore sync the same profile, settings, checks, reports, and chat history across web and mobile." }
];

export function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".hero-chip", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: "power3.out" });
      gsap.to(".scanner-ring", { rotate: 360, duration: 18, repeat: -1, ease: "none" });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
      <section ref={heroRef} className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <MedicalScene />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(248,250,252,0.96)_0%,rgba(248,250,252,0.78)_44%,rgba(248,250,252,0.28)_100%)]" />
        <div className="mx-auto grid min-h-[82svh] max-w-7xl content-center px-4 py-20">
          <div className="max-w-3xl">
            <div className="hero-chip mb-5 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-white/78 px-4 py-2 text-sm font-bold text-primary shadow-soft backdrop-blur-xl">
              <Sparkles className="h-4 w-4" />
              Premium AI healthcare workspace
            </div>
            <h1 className="text-5xl font-black leading-tight tracking-normal text-slate-950 md:text-7xl">MEDISENSE</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              A futuristic AI doctor platform for symptom triage, medical report analysis, chatbot guidance, and synchronized health history across web and mobile.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={buttonStyles({ size: "lg" })}>Start analysis <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/features" className={buttonStyles({ variant: "outline", size: "lg" })}>Explore features</Link>
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {metrics.map((item) => (
                <div key={item.label} className="hero-chip rounded-lg border border-white/80 bg-white/72 p-4 shadow-soft backdrop-blur-xl">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-sm font-black text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/80 bg-white/58 py-10 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 lg:grid-cols-[0.65fr_1fr] lg:items-center">
          <div className="relative h-40 overflow-hidden rounded-lg border border-white/80 bg-white/72 shadow-soft">
            <div className="scanner-ring absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30 border-t-primary" />
            <Lottie animationData={pulseAnimation} loop className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2" />
            <HeartPulse className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-primary" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Firebase sync", "Profiles, settings, history"],
              ["FastAPI ML", "Symptoms, OCR, reports"],
              ["Launch checks", "Builds, fallbacks, empty states"]
            ].map(([title, text]) => (
              <div key={title} className="rounded-lg border border-slate-100 bg-white/72 p-5 shadow-soft">
                <p className="font-black text-slate-950">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-16 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature, index) => (
          <motion.div key={feature.title} whileHover={{ y: -4 }} transition={{ delay: index * 0.03 }}>
            <Card className="h-full">
              <feature.icon className="mb-5 h-6 w-6 text-primary" />
              <h3 className="font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
            </Card>
          </motion.div>
        ))}
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 lg:grid-cols-[1fr_0.75fr]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/80 bg-white/70 p-5">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Interactive scanner</p>
            <h2 className="mt-2 text-2xl font-black">From symptoms to action-ready guidance</h2>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {["Fever pattern", "CBC platelets", "WBC trend", "Dengue indicators", "Typhoid exposure", "Escalation signals"].map((item) => (
              <div key={item} className="rounded-lg border border-slate-100 bg-white/76 p-4 text-sm font-bold text-slate-700">{item}</div>
            ))}
          </div>
        </Card>
        <Card>
          <Microscope className="mb-5 h-7 w-7 text-secondary" />
          <h2 className="text-2xl font-black">Built for real data, not demo screens</h2>
          <p className="mt-3 leading-7 text-slate-600">
            MEDISENSE uses the authenticated user as the source of truth. Empty dashboards show empty states, and completed workflows write to Firestore collections that power charts, history, recommendations, and mobile sync.
          </p>
        </Card>
      </section>
    </>
  );
}
