import { Card } from "@/components/ui/card";
import { PulseLine, SignalBadge } from "@/components/ui/premium";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <Card>
        <SignalBadge>About the product</SignalBadge>
        <h1 className="mt-5 text-5xl font-black tracking-normal text-ink">About MEDISENSE</h1>
        <p className="mt-5 leading-8 text-muted">MEDISENSE helps people interpret symptoms and lab reports with AI-supported guidance. It is built for accessible healthcare support and does not replace licensed medical care, emergency treatment, or prescriptions.</p>
        <PulseLine className="mt-6" />
      </Card>
    </main>
  );
}
