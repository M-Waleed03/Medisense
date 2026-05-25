import Link from "next/link";
import { Heart, Users, Zap, Shield, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/premium";
import { buttonStyles } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24 border-b border-slate-200">
        <Reveal>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 border border-blue-100 mb-6">
              <div className="h-2 w-2 rounded-full bg-blue-600" />
              <span className="text-sm font-semibold text-blue-900">About us</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mt-6">Making healthcare accessible to everyone</h1>
            <p className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              MEDISENSE is an AI-powered health platform designed to help people understand their symptoms, interpret medical reports, and make informed health decisions with clinical-grade accuracy.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Mission & Vision */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24 grid gap-12 md:grid-cols-2">
        <Reveal>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Our mission</h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-4">
              We believe healthcare decisions should be informed, accessible, and empowering. MEDISENSE combines medical AI with intuitive design to bridge the gap between symptoms and understanding.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              Whether you're managing chronic conditions, analyzing test results, or understanding new symptoms—MEDISENSE provides instant, clinical-grade insights without appointment delays.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.04}>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Our values</h2>
            <ul className="space-y-4">
              {[
                { icon: Heart, title: "Patient-first", desc: "Your health is our priority. We design every feature with your needs in mind." },
                { icon: Shield, title: "Privacy & security", desc: "Your data is encrypted end-to-end. We follow HIPAA compliance standards." },
                { icon: Zap, title: "Accuracy", desc: "Built on peer-reviewed research and machine learning trained on clinical data." },
                { icon: Users, title: "Accessibility", desc: "Healthcare insights for everyone, regardless of medical background." }
              ].map((value) => {
                const Icon = value.icon;
                return (
                  <li key={value.title} className="flex gap-3">
                    <Icon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-bold text-slate-900">{value.title}</p>
                      <p className="text-slate-600">{value.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* How we work */}
      <section className="bg-slate-50 py-16 md:py-24 border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 md:text-5xl">Powered by medical AI</h2>
              <p className="mt-4 text-lg text-slate-600">How MEDISENSE delivers clinical-grade insights</p>
            </div>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Machine learning models",
                description: "Trained on thousands of symptom cases, disease patterns, and lab values to predict diseases with 96%+ accuracy."
              },
              {
                title: "Medical OCR technology",
                description: "Tesseract-powered extraction from blood tests and pathology reports. Recognizes lab markers: platelet count, WBC, hemoglobin."
              },
              {
                title: "Clinical knowledge base",
                description: "AI assistant trained on medical literature, drug information, and evidence-based guidelines for safe, informed recommendations."
              }
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.05}>
                <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Important Disclaimer */}
      <section className="mx-auto max-w-4xl px-4 py-16 md:py-24">
        <Reveal>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-8">
            <h3 className="text-lg font-bold text-amber-900 mb-4">Important: Not a substitute for medical care</h3>
            <p className="text-amber-800 leading-relaxed mb-4">
              MEDISENSE is designed for <strong>health awareness and support</strong>, not medical diagnosis or treatment. It does not replace:
            </p>
            <ul className="space-y-2 text-amber-800 mb-6 pl-4">
              <li>• Licensed medical professionals or doctors</li>
              <li>• Emergency medical treatment (call 911 for emergencies)</li>
              <li>• Medical prescriptions or medications</li>
              <li>• Clinical diagnosis or formal medical advice</li>
            </ul>
            <p className="text-amber-800 leading-relaxed">
              Always consult with a qualified healthcare provider for medical concerns, diagnosis, or treatment decisions. Use MEDISENSE to prepare for doctor visits and understand your health better.
            </p>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-600 to-blue-700 p-12 text-white shadow-lg md:p-16">
            <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="relative text-center">
              <h2 className="text-4xl font-bold md:text-5xl">Join thousands using MEDISENSE</h2>
              <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
                Get instant health insights with AI-powered medical intelligence.
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
