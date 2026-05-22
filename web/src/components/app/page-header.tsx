export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">MEDISENSE Command Layer</p>
        <h1 className="mt-2 text-4xl font-black tracking-normal text-ink md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-muted">{subtitle}</p>
      </div>
    </div>
  );
}
