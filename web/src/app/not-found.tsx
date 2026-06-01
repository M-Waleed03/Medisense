import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-deep-space px-4">
      <div className="max-w-md border border-lead/35 bg-midnight-slate p-6 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-silver">MEDISENSE</p>
        <h1 className="mt-2 font-arcadiaDisplay text-heading font-light text-starlight">Page not found</h1>
        <p className="mt-3 text-sm text-silver">The page you opened is not part of this workspace.</p>
        <Link href="/dashboard" className="mt-5 inline-flex h-11 items-center justify-center rounded-pill bg-primary px-5 text-sm font-medium text-pure-white transition hover:bg-primary/90">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
