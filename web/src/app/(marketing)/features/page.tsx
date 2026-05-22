import { Bot, FileScan, HeartPulse, LineChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SignalBadge } from "@/components/ui/premium";

const items = [
  ["Symptom intelligence", "Structured symptom intake with disease prediction and confidence scoring.", HeartPulse],
  ["Medical OCR", "Tesseract-backed report extraction for CBC-style values and risk interpretation.", FileScan],
  ["AI guidance", "Chatbot guidance designed around safe next steps and clinical escalation.", Bot],
  ["Health analytics", "Dashboard cards, charts, and longitudinal user history.", LineChart]
] as const;

export default function FeaturesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16">
      <SignalBadge>MEDISENSE platform</SignalBadge>
      <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-normal text-ink">Premium AI healthcare workflows</h1>
      <p className="mt-4 max-w-2xl text-muted">A connected product surface for symptoms, reports, chatbot guidance, and longitudinal health analytics.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {items.map(([title, text, Icon]) => (
          <Card key={title as string} className="min-h-52">
            <Icon className="mb-4 h-6 w-6 text-primary" />
            <h2 className="text-2xl font-black text-ink">{title}</h2>
            <p className="mt-3 leading-7 text-muted">{text}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
