"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { doctors } from "@/data/doctors";
import { HeartPulse, MessageCircle, ShieldCheck } from "lucide-react";

export default function DoctorsPage() {
  const searchParams = useSearchParams();
  const disease = searchParams.get("disease") ?? "your condition";
  const confidence = searchParams.get("confidence");
  const summary = useMemo(() => {
    if (!confidence) return `Prediction: ${disease}`;
    return `Prediction: ${disease} (${confidence}%)`;
  }, [confidence, disease]);

  return (
    <div className="space-y-5">
      <PageHeader title="Doctor consultation" subtitle="Choose a clinician, review the AI prediction, and continue via WhatsApp." />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_0.45fr]">
        <div className="space-y-5">
          <Card className="rounded-[32px] border border-lead/20 bg-midnight-slate/80 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-silver">MEDISENSE prediction</p>
                <p className="mt-3 text-xl font-semibold text-pure-white">{summary}</p>
              </div>
              <div className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">Doctor referral</div>
            </div>
            <p className="mt-4 text-sm leading-6 text-silver">This page helps you select a doctor and open a WhatsApp consultation prefilled with your MEDISENSE prediction. Use the button on any doctor card to continue.</p>
          </Card>

          <div className="grid gap-4">
            {doctors.map((doctor) => {
              const whatsappUrl = `https://wa.me/${doctor.phone}?text=${encodeURIComponent(`Hello ${doctor.name}, I used MEDISENSE and received a prediction for ${disease}${confidence ? ` with ${confidence}% confidence` : ""}. I’d like a consultation.`)}`;
              return (
                <Card key={doctor.id} className="rounded-[32px] border border-lead/20 bg-midnight-slate/80 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-[32px] border border-lead/20 bg-graphite">
                        <Image src={doctor.image} alt={doctor.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-pure-white">{doctor.name}</p>
                        <p className="mt-1 text-sm text-silver">{doctor.specialty}</p>
                        <p className="mt-2 text-sm text-silver">{doctor.location} · {doctor.experience}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 text-right">
                      <span className="text-sm text-silver">Rating</span>
                      <span className="text-2xl font-semibold text-pure-white">{doctor.rating.toFixed(1)} ★</span>
                      <Link href={whatsappUrl} target="_blank" rel="noreferrer">
                        <Button className="mt-3 w-full" size="sm">
                          <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp consult
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-silver">{doctor.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <Card className="rounded-[32px] border border-lead/20 bg-midnight-slate/80 p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-pure-white">Safe next steps</p>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-silver">
              <li>1. Review the prediction before sending.</li>
              <li>2. Open WhatsApp with a prefilled message.</li>
              <li>3. Share any additional symptoms to get faster guidance.</li>
              <li>{"4. If it&apos;s urgent, choose the doctor and contact immediately."}</li>
            </ul>
          </Card>

          <Card className="rounded-[32px] border border-lead/20 bg-midnight-slate/80 p-5">
            <p className="text-sm text-silver">MEDISENSE doctor consultation is intended to bridge your AI prediction with a telehealth contact point. It is not a substitute for emergency care.</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
