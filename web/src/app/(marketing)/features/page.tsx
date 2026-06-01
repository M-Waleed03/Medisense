import Link from "next/link";
import { ArrowRight, BarChart3, Brain, Check, Clock, Heart, Lock, Zap } from "lucide-react";
import { Reveal } from "@/components/ui/premium";
import { buttonStyles } from "@/components/ui/button";

const features = [
  {
    icon: Heart,
    title: "Smart symptom analysis",
    description: "Describe fever, cough, digestive issues, exposure history, and safety risks to get AI-backed probability and escalation guidance.",
    benefits: ["Disease prediction", "Risk stratification", "Saved checks"]
  },
  {
    icon: BarChart3,
    title: "Report interpretation",
    description: "Upload CBC and pathology reports so OCR can extract platelet count, WBC, hemoglobin, and other markers for trend tracking.",
    benefits: ["Automatic extraction", "Lab value context", "Longitudinal trends"]
  },
  {
    icon: Brain,
    title: "Medical AI assistant",
    description: "Ask health questions with profile, symptom history, report context, and previous conversations available to MEDISENSE.",
    benefits: ["Context-aware answers", "Safe next steps", "History-aware chat"]
  },
  {
    icon: Lock,
    title: "Privacy-first architecture",
    description: "Firebase authentication and Firestore records keep the same protected account layer across the web and mobile apps.",
    benefits: ["Shared identity", "Protected data", "Account controls"]
  },
  {
    icon: Clock,
    title: "Health history",
    description: "Symptoms, chats, report analyses, and profile data stay organized for follow-up visits and personal monitoring.",
    benefits: ["Timeline view", "Report graphs", "Care continuity"]
  },
  {
    icon: Zap,
    title: "Fast clinical workflow",
    description: "MEDISENSE is built for quick patient inputs, readable results, and focused dashboards without distracting visual noise.",
    benefits: ["Responsive UI", "Clear results", "No clutter"]
  }
];

export default function FeaturesPage() {
  return (
    <main className="bg-deep-space">
      <section className="mx-auto max-w-[1200px] px-4 py-20 md:py-28">
        <Reveal>
          <div className="max-w-4xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-silver">Complete platform</p>
            <h1 className="mt-5 font-arcadiaDisplay text-display font-light leading-[1.1] text-starlight">Comprehensive health AI platform</h1>
            <p className="mt-6 max-w-3xl text-heading-sm font-light leading-8 text-silver">
              Intelligent symptom analysis, medical report interpretation, AI guidance, and health tracking in one secure command-center workspace.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pb-24">
        <div className="grid gap-x-10 gap-y-2 md:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={index * 0.04}>
                <div className="border-b border-lead/40 py-8">
                  <Icon className="h-6 w-6 text-starlight" />
                  <h3 className="mt-5 font-arcadiaDisplay text-heading-sm font-light text-starlight">{feature.title}</h3>
                  <p className="mt-3 text-body-sm leading-6 text-silver">{feature.description}</p>
                  <ul className="mt-5 grid gap-2">
                    {feature.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2 text-sm text-silver">
                        <Check className="h-4 w-4 text-starlight" />
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

      <section className="bg-midnight-slate py-20 md:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 md:grid-cols-3">
          {[
            ["1", "Input your data", "Describe symptoms or upload medical reports. MEDISENSE processes the input without changing your backend workflow."],
            ["2", "Get AI analysis", "Receive predictions, lab interpretations, confidence signals, and safety guidance."],
            ["3", "Track and decide", "Review saved history, trends, and profile context before follow-up care."]
          ].map(([step, title, description], index) => (
            <Reveal key={step} delay={index * 0.05}>
              <div className="border-l border-lead/40 pl-6">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-silver">Step {step}</p>
                <h2 className="mt-5 font-arcadiaDisplay text-heading-sm font-light text-starlight">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-silver">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-20 md:py-28">
        <Reveal>
          <div className="border border-lead/35 bg-midnight-slate/70 p-8 text-center md:p-14">
            <h2 className="font-arcadiaDisplay text-heading-lg font-light text-starlight">Ready to try MEDISENSE?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-silver">Start analyzing symptoms and reports with focused AI-powered medical intelligence.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Link href="/signup" className={buttonStyles({ size: "lg", className: "min-w-44" })}>
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className={buttonStyles({ variant: "outline", size: "lg", className: "min-w-44" })}>
                Contact us
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
