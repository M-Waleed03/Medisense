import { Bot, FileScan, HeartPulse, LineChart } from "lucide-react";
import { Card } from "@/components/ui/card";

const items = [
  ["Symptom intelligence", "Structured symptom intake with disease prediction and confidence scoring.", HeartPulse],
  ["Medical OCR", "Tesseract-backed report extraction for CBC-style values and risk interpretation.", FileScan],
  ["AI guidance", "Chatbot guidance designed around safe next steps and clinical escalation.", Bot],
  ["Health analytics", "Dashboard cards, charts, and longitudinal user history.", LineChart]
] as const;

export default function FeaturesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16">
      <h1 className="text-4xl font-black">Features</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {items.map(([title, text, Icon]) => (
          <Card key={title as string}>
            <Icon className="mb-4 h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-2 text-slate-600">{text}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
