import Link from "next/link";
import { Brain, Zap, Heart, BarChart3, Lock, Clock, Check, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/premium";
import { buttonStyles } from "@/components/ui/button";

const features = [
  {
    icon: Heart,
    title: "Smart symptom analysis",
    description: "Describe your symptoms—fever, cough, digestive issues—and get AI-powered disease predictions with confidence scoring based on medical literature and training data.",
    benefits: ["Disease prediction", "Risk stratification", "Real-time analysis"]
  },
  {
    icon: BarChart3,
    title: "Report interpretation",
    description: "Upload blood test reports (CBC, pathology) and our OCR technology extracts key values: platelet count, WBC, hemoglobin—with clinical insights and trend tracking.",
    benefits: ["Automatic data extraction", "Historical trends", "Lab value interpretation"]
  },
  {
    icon: Brain,
    title: "Medical AI assistant",
    description: "Ask MEDISENSE health questions. The chatbot learns from your profile, symptom history, and uploaded reports to give context-aware, personalized guidance.",
    benefits: ["Context-aware responses", "Medical knowledge base", "Safe escalation advice"]
  },
  {
    icon: Lock,
    title: "Privacy-first architecture",
    description: "All data encrypted end-to-end. Local processing options available. Full HIPAA compliance and no third-party data sharing.",
    benefits: ["E2E encryption", "Local processing", "HIPAA compliant"]
  },
  {
    icon: Clock,
    title: "24/7 health monitoring",
    description: "Track health metrics over time. Build longitudinal records of symptoms, reports, and chat history for better health decisions and doctor conversations.",
    benefits: ["Trend tracking", "Health history", "Appointment prep"]
  },
  {
    icon: Zap,
    title: "Instant insights",
    description: "Get results in seconds. No waiting for appointments. MEDISENSE combines medical intelligence with accessible healthcare support designed for everyone.",
    benefits: ["Real-time analysis", "Instant recommendations", "No delays"]
  }
];

export default function FeaturesPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <Reveal>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 border border-blue-100 mb-6">
              <div className="h-2 w-2 rounded-full bg-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Complete platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mt-6">Comprehensive health AI platform</h1>
            <p className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Everything you need for intelligent symptom analysis, medical report interpretation, AI guidance, and health tracking—all in one secure platform.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 pb-24">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={index * 0.05}>
                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed mb-6 flex-grow">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2 text-sm text-slate-700">
                        <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-slate-200 bg-slate-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900">How MEDISENSE works</h2>
              <p className="mt-4 text-lg text-slate-600">Three simple steps to health insights</p>
            </div>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Input your data",
                description: "Describe symptoms or upload medical reports. MEDISENSE instantly processes your input with OCR and AI analysis."
              },
              {
                step: "2",
                title: "Get AI analysis",
                description: "Receive disease predictions, lab value interpretations, and risk assessments backed by clinical research and machine learning."
              },
              {
                step: "3",
                title: "Track & decide",
                description: "Monitor health trends over time, save history, and use insights to prepare for doctor visits or make informed health decisions."
              }
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 0.06}>
                <div className="relative">
                  <div className="flex flex-col items-start">
                    <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-600 to-blue-700 p-12 text-white shadow-lg md:p-16">
            <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="relative text-center">
              <h2 className="text-4xl font-bold md:text-5xl">Ready to try MEDISENSE?</h2>
              <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
                Start analyzing symptoms and reports with AI-powered medical intelligence today.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
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
    </main>
  );
}
