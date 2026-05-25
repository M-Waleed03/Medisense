"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import gsap from "gsap";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Heart, BarChart3, Shield, Zap, CheckCircle, Brain } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { AiAvatar, HoloPanel, Reveal } from "@/components/ui/premium";

const MedicalScene = dynamic(() => import("@/components/visuals/medical-scene").then((module) => module.MedicalScene), {
  ssr: false,
  loading: () => <div className="h-[76svh] min-h-[520px] w-full bg-gradient-to-b from-blue-50 to-white md:h-[82svh]" />
});

const typingPhrases = [
  "Analyzing symptom patterns",
  "Reading diagnostic signals",
  "Assessing health risks",
  "Building treatment plans"
];

const featureTiles = [
  { 
    icon: Heart, 
    title: "Smart symptom analysis", 
    text: "Intelligent fever, respiratory, and digestive assessment with clinical-grade accuracy and risk stratification." 
  },
  { 
    icon: BarChart3, 
    title: "Report interpretation", 
    text: "Instant CBC analysis, platelet tracking, WBC trends, and clinician-ready summaries from image uploads." 
  },
  { 
    icon: Brain, 
    title: "Medical AI assistant", 
    text: "Context-aware conversations that learn from your health history, reports, and medical profile." 
  },
  { 
    icon: Shield, 
    title: "Privacy-first platform", 
    text: "End-to-end encrypted data, local processing options, and full healthcare compliance standards." 
  }
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
    const id = window.setInterval(() => setTypingIndex((current) => (current + 1) % typingPhrases.length), 2400);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".hero-reveal", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: "power2.out" });
      gsap.to(".float-element", { y: -8, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: 0.15 });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const stats = useMemo(() => [
    ["Diagnostic tracks", "8+"],
    ["Lab markers", "15+"],
    ["AI accuracy", "96%"]
  ], []);

  return (
    <>
      <section ref={heroRef} className="relative overflow-hidden bg-white">
        <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl px-4 py-16 md:py-20 lg:grid-cols-2 lg:items-center lg:gap-12">
          {/* Left content */}
          <div className="max-w-2xl">
            <div className="hero-reveal">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 border border-blue-100">
                <div className="h-2 w-2 rounded-full bg-blue-600" />
                <span className="text-sm font-semibold text-blue-900">AI-Powered Medical Intelligence</span>
              </div>
            </div>

            <h1 className="hero-reveal mt-8 text-5xl font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-6xl">
              Your personal health diagnostic assistant
            </h1>

            <p className="hero-reveal mt-6 text-lg leading-8 text-slate-600 md:text-xl">
              Get instant analysis of symptoms, medical reports, and health concerns with clinical-grade accuracy. Understand your health with confidence.
            </p>

            <div className="hero-reveal mt-8 flex items-center gap-4 rounded-xl border border-slate-200 bg-white/80 backdrop-blur px-5 py-4 shadow-sm">
              <AiAvatar size="sm" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  MEDISENSE is <span className="text-blue-600">{phrase}</span>
                  <span className="ml-1.5 inline-block h-4 w-1 translate-y-0.5 animate-pulse rounded-full bg-blue-600" />
                </p>
              </div>
            </div>

            <div className="hero-reveal mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/signup" className={buttonStyles({ size: "lg", className: "min-w-48" })}>
                Start analysis <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
              <Link href="/features" className={buttonStyles({ variant: "outline", size: "lg", className: "min-w-48" })}>
                Learn more
              </Link>
            </div>

            <div className="hero-reveal mt-12 grid gap-4 sm:grid-cols-3">
              {stats.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right animation - no overlay */}
          <div className="hidden lg:block relative h-[600px]">
            <MedicalScene />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/0 to-white/40" />
            
            {/* Floating card */}
            <div className="absolute bottom-8 left-6 right-6">
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-semibold text-slate-900">Health assessment complete</p>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your CBC analysis shows stable platelet levels. Continue hydration and schedule follow-up in 2 weeks.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Credibility Section */}
      <section className="border-t border-slate-200 bg-gradient-to-b from-white to-slate-50 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              ["Clinical-grade", "Built on peer-reviewed medical research and ML models"],
              ["Privacy-first", "HIPAA-compliant with end-to-end data encryption"],
              ["Always available", "24/7 health insights without appointment delays"]
            ].map(([title, desc], i) => (
              <Reveal key={title} delay={i * 0.04}>
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 md:py-20 md:grid-cols-2 xl:grid-cols-4">
        {featureTiles.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 0.05}>
            <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
              <div className="h-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{feature.text}</p>
              </div>
            </motion.div>
          </Reveal>
        ))}
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <Reveal>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 md:text-5xl">How it works</h2>
            <p className="mt-4 text-lg text-slate-600">Simple, intuitive healthcare at your fingertips</p>
          </div>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            ["1", "Upload or describe", "Share your symptoms or upload medical reports for instant analysis"],
            ["2", "AI analysis", "Our medical AI provides detailed insights, risk assessment, and recommendations"],
            ["3", "Track & follow up", "Monitor trends, save history, and stay updated with personalized guidance"]
          ].map(([step, title, desc], i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {step}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <p className="mt-2 text-slate-600">{desc}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-600 to-blue-700 p-12 text-white shadow-lg md:p-16">
            <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="relative">
              <h2 className="text-4xl font-bold md:text-5xl max-w-2xl">
                Take control of your health today
              </h2>
              <p className="mt-4 text-lg text-blue-100 max-w-xl">
                Join thousands of users getting faster diagnoses and better health decisions with AI-powered medical analysis.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className={buttonStyles({ size: "lg", className: "bg-white text-blue-600 hover:bg-blue-50 min-w-44" })}>
                  Get started free <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
                <Link href="/contact" className={buttonStyles({ variant: "outline", size: "lg", className: "border-white/30 text-white hover:bg-white/10 min-w-44" })}>
                  Contact us
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
