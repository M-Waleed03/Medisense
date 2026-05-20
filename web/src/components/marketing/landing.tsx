"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, Bot, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const MedicalScene = dynamic(() => import("@/components/visuals/medical-scene").then((module) => module.MedicalScene), {
  ssr: false,
  loading: () => <div className="h-[420px] w-full animate-pulse rounded-lg bg-blue-50/80 md:h-[560px]" />
});

const features = [
  { icon: Sparkles, title: "AI symptom checking", text: "Dengue, malaria, typhoid, and viral fever risk guidance." },
  { icon: FileText, title: "OCR report analysis", text: "Extracts platelets, WBC, hemoglobin, and clinical hints." },
  { icon: Bot, title: "Healthcare chatbot", text: "Clear next-step guidance with safe escalation language." },
  { icon: ShieldCheck, title: "Secure history", text: "Supabase Auth, RLS-backed records, and protected routes." }
];

export function Landing() {
  return (
    <>
      <section className="mesh relative overflow-hidden">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-[1fr_0.9fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="mb-4 inline-flex rounded-full border border-primary/20 bg-white/70 px-4 py-2 text-sm font-semibold text-primary">AI-powered healthcare assistant</p>
            <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-normal text-slate-950 md:text-7xl">MEDISENSE</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Understand symptoms, decode medical reports, and track health guidance through a premium, secure healthcare dashboard.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={buttonStyles({ size: "lg" })}>Start analysis <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/features" className={buttonStyles({ variant: "outline", size: "lg" })}>Explore features</Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }} className="overflow-hidden rounded-lg border border-blue-100/70 bg-white/45 shadow-soft">
            <MedicalScene />
          </motion.div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-16 md:grid-cols-4">
        {features.map((feature, index) => (
          <motion.div key={feature.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }}>
            <Card className="h-full">
              <feature.icon className="mb-5 h-6 w-6 text-primary" />
              <h3 className="font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
            </Card>
          </motion.div>
        ))}
      </section>
    </>
  );
}
