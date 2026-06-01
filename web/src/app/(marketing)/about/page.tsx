import Link from "next/link";
import { ArrowRight, Heart, Shield, Users, Zap } from "lucide-react";
import { Reveal } from "@/components/ui/premium";
import { buttonStyles } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <main className="bg-deep-space">
      <section className="mx-auto max-w-[1200px] border-b border-lead/30 px-4 py-20 md:py-28">
        <Reveal>
          <div className="max-w-4xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-silver">About MEDISENSE</p>
            <h1 className="mt-5 font-arcadiaDisplay text-display font-light leading-[1.1] text-starlight">Making healthcare intelligence easier to read.</h1>
            <p className="mt-6 max-w-3xl text-heading-sm font-light leading-8 text-silver">
              MEDISENSE helps people understand symptoms, reports, and care context with a calm AI doctor workspace that supports informed health decisions.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-14 px-4 py-20 md:grid-cols-2 md:py-28">
        <Reveal>
          <div>
            <h2 className="font-arcadiaDisplay text-heading font-light text-starlight">Our mission</h2>
            <p className="mt-5 text-lg leading-8 text-silver">
              Healthcare decisions should feel understandable, accessible, and prepared. MEDISENSE bridges the gap between raw health signals and practical next steps.
            </p>
            <p className="mt-5 text-lg leading-8 text-silver">
              The platform keeps symptom analysis, report review, AI guidance, and history in one secure record across web and mobile.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.04}>
          <div>
            <h2 className="font-arcadiaDisplay text-heading font-light text-starlight">Our values</h2>
            <ul className="mt-6 space-y-6">
              {[
                { icon: Heart, title: "Patient-first", desc: "Every screen prioritizes clarity, calm, and practical action." },
                { icon: Shield, title: "Privacy and security", desc: "Authentication and data access stay tied to protected Firebase-backed accounts." },
                { icon: Zap, title: "Accuracy", desc: "Model outputs are framed with confidence, risk, and safety guidance." },
                { icon: Users, title: "Accessibility", desc: "Medical context is translated into readable language for everyday users." }
              ].map((value) => {
                const Icon = value.icon;
                return (
                  <li key={value.title} className="flex gap-4 border-b border-lead/30 pb-6">
                    <Icon className="mt-1 h-5 w-5 shrink-0 text-starlight" />
                    <div>
                      <p className="font-medium text-starlight">{value.title}</p>
                      <p className="mt-1 text-sm leading-6 text-silver">{value.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </section>

      <section className="bg-midnight-slate py-20 md:py-28">
        <div className="mx-auto max-w-[1200px] px-4">
          <Reveal>
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-silver">Medical AI layer</p>
              <h2 className="mt-4 font-arcadiaDisplay text-heading-lg font-light leading-[1.15] text-starlight">Powered by structured health workflows.</h2>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              ["Machine learning models", "Trained on symptom cases, disease patterns, and lab values to support predictions."],
              ["Medical OCR technology", "Extracts CBC markers such as platelets, WBC, and hemoglobin from reports."],
              ["Clinical knowledge base", "Guidance is written for awareness, next steps, and doctor-prep context."]
            ].map(([title, description], index) => (
              <Reveal key={title} delay={index * 0.05}>
                <div className="min-h-56 border border-lead/35 bg-deep-space/45 p-6">
                  <h3 className="font-arcadiaDisplay text-heading-sm font-light text-starlight">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-silver">{description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 md:py-28">
        <Reveal>
          <div className="border border-lead/40 bg-midnight-slate/70 p-8">
            <h3 className="font-arcadiaDisplay text-heading-sm font-light text-starlight">Important medical note</h3>
            <p className="mt-4 leading-7 text-silver">
              MEDISENSE is designed for health awareness and support, not emergency care, formal diagnosis, prescriptions, or replacement of licensed clinicians. For emergencies, call local emergency services.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pb-24">
        <Reveal>
          <div className="border border-lead/35 bg-midnight-slate/70 p-8 text-center md:p-14">
            <h2 className="font-arcadiaDisplay text-heading-lg font-light text-starlight">Join MEDISENSE</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-silver">Get instant health insights with focused AI-powered medical intelligence.</p>
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
