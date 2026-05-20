export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">MEDISENSE</p>
        <h1 className="mt-1 text-3xl font-black text-slate-950 md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-slate-600">{subtitle}</p>
      </div>
    </div>
  );
}
