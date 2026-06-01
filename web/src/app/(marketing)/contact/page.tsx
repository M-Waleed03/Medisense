"use client";

import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { Reveal } from "@/components/ui/premium";
import { buttonStyles } from "@/components/ui/button";

export default function ContactPage() {
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormStatus("loading");
    setTimeout(() => {
      setFormStatus("success");
      setTimeout(() => setFormStatus("idle"), 3000);
    }, 1000);
  };

  return (
    <main className="bg-deep-space">
      <section className="mx-auto max-w-[1200px] border-b border-lead/30 px-4 py-20 md:py-28">
        <Reveal>
          <div className="max-w-4xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-silver">Get in touch</p>
            <h1 className="mt-5 font-arcadiaDisplay text-display font-light leading-[1.1] text-starlight">Contact MEDISENSE</h1>
            <p className="mt-6 max-w-3xl text-heading-sm font-light leading-8 text-silver">
              Questions about the platform, partnerships, or support? Send a note to the MEDISENSE team.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-14 px-4 py-20 lg:grid-cols-[0.8fr_1fr]">
        <Reveal>
          <div>
            <h2 className="font-arcadiaDisplay text-heading font-light text-starlight">Reach us</h2>
            <div className="mt-8 space-y-6">
              {[
                { icon: Mail, title: "Email", content: "support@medisense.ai", href: "mailto:support@medisense.ai" },
                { icon: Phone, title: "Phone", content: "+1 (555) 123-4567", href: "tel:+15551234567" },
                { icon: MapPin, title: "Address", content: "123 Medical Street, Healthcare City", href: null }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-4 border-b border-lead/30 pb-6">
                    <Icon className="mt-1 h-5 w-5 shrink-0 text-starlight" />
                    <div>
                      <p className="font-medium text-starlight">{item.title}</p>
                      {item.href ? (
                        <a href={item.href} className="text-silver transition-colors hover:text-starlight">{item.content}</a>
                      ) : (
                        <p className="text-silver">{item.content}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-10 border border-lead/35 bg-midnight-slate/70 p-5">
              <div className="flex gap-3">
                <Clock className="mt-1 h-5 w-5 shrink-0 text-starlight" />
                <div>
                  <p className="font-medium text-starlight">Response time</p>
                  <p className="mt-1 text-sm text-silver">Most inquiries receive a response within 24 hours.</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.04}>
          <div>
            <h2 className="font-arcadiaDisplay text-heading font-light text-starlight">Send a message</h2>
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <Field label="Full name">
                <input type="text" placeholder="Your name" required className="premium-input" />
              </Field>
              <Field label="Email address">
                <input type="email" placeholder="your@email.com" required className="premium-input" />
              </Field>
              <Field label="Subject">
                <select required className="premium-input">
                  <option value="">Select a subject</option>
                  <option value="support">Technical support</option>
                  <option value="features">Feature request</option>
                  <option value="partnership">Partnership inquiry</option>
                  <option value="feedback">General feedback</option>
                </select>
              </Field>
              <Field label="Message">
                <textarea placeholder="Tell us how we can help..." required rows={6} className="premium-input min-h-40 resize-none py-4" />
              </Field>
              <button type="submit" disabled={formStatus === "loading"} className={buttonStyles({ size: "lg", className: "w-full" })}>
                {formStatus === "loading" ? "Sending..." : formStatus === "success" ? "Message sent" : <>Send message <ArrowRight className="h-4 w-4" /></>}
              </button>
              {formStatus === "success" && (
                <div className="border border-lead/40 bg-graphite/55 p-4 text-sm text-starlight">
                  Thank you. We received your message and will get back to you soon.
                </div>
              )}
            </form>
          </div>
        </Reveal>
      </section>

      <section className="bg-midnight-slate py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <h2 className="font-arcadiaDisplay text-heading-lg font-light text-starlight">Frequently asked questions</h2>
          </Reveal>
          <div className="mt-8 space-y-4">
            {[
              ["Is MEDISENSE a replacement for doctor visits?", "No. MEDISENSE is designed for health awareness and support. Consult qualified clinicians for diagnosis, treatment, or urgent care."],
              ["How secure is my health data?", "The app keeps authentication and user records connected to the existing Firebase-backed account layer."],
              ["What if I need urgent clinical support?", "For medical emergencies, call local emergency services immediately."],
              ["Do you offer clinic partnerships?", "Yes. Contact us with partnership details and the team can follow up."]
            ].map(([question, answer], index) => (
              <Reveal key={question} delay={index * 0.04}>
                <details className="group border border-lead/35 bg-deep-space/45 p-5">
                  <summary className="cursor-pointer font-medium text-starlight">{question}</summary>
                  <p className="mt-4 text-sm leading-6 text-silver">{answer}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-20 md:py-28">
        <Reveal>
          <div className="border border-lead/35 bg-midnight-slate/70 p-8 text-center md:p-14">
            <h2 className="font-arcadiaDisplay text-heading-lg font-light text-starlight">Ready to start?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-silver">Get instant health insights with MEDISENSE.</p>
            <Link href="/signup" className={buttonStyles({ size: "lg", className: "mt-8 inline-flex" })}>
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-silver">
      {label}
      {children}
    </label>
  );
}
