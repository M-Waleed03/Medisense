import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <Card>
        <h1 className="text-4xl font-black">About MEDISENSE</h1>
        <p className="mt-5 leading-8 text-slate-600">MEDISENSE helps people interpret symptoms and lab reports with AI-supported guidance. It is built for accessible healthcare support and does not replace licensed medical care, emergency treatment, or prescriptions.</p>
      </Card>
    </main>
  );
}
