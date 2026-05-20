import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="max-w-md rounded-lg border border-slate-100 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">MEDISENSE</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Page not found</h1>
        <p className="mt-3 text-sm text-slate-600">The page you opened is not part of this workspace.</p>
        <Link href="/dashboard" className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-blue-600">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
