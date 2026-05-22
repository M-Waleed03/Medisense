import { Card } from "@/components/ui/card";
import { SignalBadge } from "@/components/ui/premium";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Card>
        <SignalBadge>Clinical partners</SignalBadge>
        <h1 className="mt-5 text-5xl font-black tracking-normal text-ink">Contact</h1>
        <p className="mt-4 leading-8 text-muted">For clinics, labs, or support inquiries, contact the MEDISENSE team through your configured project support channel.</p>
      </Card>
    </main>
  );
}
