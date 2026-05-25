"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Clock, Zap, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/premium";
import { buttonStyles } from "@/components/ui/button";
import { useState } from "react";

export default function ContactPage() {
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("loading");
    
    // Simulate form submission
    setTimeout(() => {
      setFormStatus("success");
      setTimeout(() => setFormStatus("idle"), 3000);
    }, 1000);
  };

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24 border-b border-slate-200">
        <Reveal>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 border border-blue-100 mb-6">
              <div className="h-2 w-2 rounded-full bg-blue-600" />
              <span className="text-sm font-semibold text-blue-900">Get in touch</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mt-6">Contact MEDISENSE</h1>
            <p className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Have questions about our platform? Want to partner with us? We'd love to hear from you.
            </p>
          </div>
        </Reveal>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Contact info */}
          <Reveal>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Reach out to us</h2>
              
              <div className="space-y-6 mb-12">
                {[
                  { icon: Mail, title: "Email", content: "support@medisense.ai", href: "mailto:support@medisense.ai" },
                  { icon: Phone, title: "Phone", content: "+1 (555) 123-4567", href: "tel:+15551234567" },
                  { icon: MapPin, title: "Address", content: "123 Medical Street, Healthcare City, HC 12345", href: null }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-4">
                      <Icon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-bold text-slate-900">{item.title}</p>
                        {item.href ? (
                          <a href={item.href} className="text-slate-600 hover:text-blue-600 transition-colors">
                            {item.content}
                          </a>
                        ) : (
                          <p className="text-slate-600">{item.content}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex gap-3 mb-3">
                  <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900">Response time</p>
                    <p className="text-sm text-slate-600">We typically respond to inquiries within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Contact form */}
          <Reveal delay={0.04}>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-8">Send us a message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Full name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Email address</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Subject</label>
                  <select
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">Select a subject</option>
                    <option value="support">Technical support</option>
                    <option value="features">Feature request</option>
                    <option value="partnership">Partnership inquiry</option>
                    <option value="feedback">General feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Message</label>
                  <textarea
                    placeholder="Tell us how we can help..."
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formStatus === "loading"}
                  className={buttonStyles({ size: "lg", className: "w-full" })}
                >
                  {formStatus === "loading" ? (
                    "Sending..."
                  ) : formStatus === "success" ? (
                    "Message sent!"
                  ) : (
                    <>
                      Send message <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>

                {formStatus === "success" && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    Thank you! We've received your message and will get back to you soon.
                  </div>
                )}
              </form>
            </div>
          </Reveal>
        </div>
      </div>

      {/* FAQ */}
      <section className="border-t border-slate-200 bg-slate-50 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900">Frequently asked questions</h2>
            </div>
          </Reveal>

          <div className="space-y-6">
            {[
              {
                q: "Is MEDISENSE a replacement for doctor visits?",
                a: "No. MEDISENSE is designed for health awareness and support. Always consult with a qualified healthcare provider for medical diagnosis, treatment, or emergency care."
              },
              {
                q: "How secure is my health data?",
                a: "Your data is encrypted end-to-end with HIPAA compliance. We don't share your information with third parties and offer local processing options for maximum privacy."
              },
              {
                q: "What if I need clinical support?",
                a: "For medical emergencies, call 911 immediately. For other concerns, consult a licensed healthcare provider in your area."
              },
              {
                q: "Do you offer enterprise or clinic partnerships?",
                a: "Yes! We work with clinics, labs, and healthcare organizations. Contact our sales team for partnership inquiries."
              }
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <details className="group rounded-lg border border-slate-200 bg-white p-6 cursor-pointer hover:shadow-sm transition-shadow">
                  <summary className="flex items-center justify-between font-semibold text-slate-900">
                    {item.q}
                    <span className="group-open:rotate-180 transition-transform">
                      <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-4 text-slate-600 leading-relaxed">{item.a}</p>
                </details>
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
              <h2 className="text-4xl font-bold md:text-5xl">Ready to start?</h2>
              <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
                Get instant health insights with MEDISENSE.
              </p>
              <Link href="/signup" className={buttonStyles({ size: "lg", className: "mt-8 bg-white text-blue-600 hover:bg-blue-50 inline-flex" })}>
                Get started free <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
