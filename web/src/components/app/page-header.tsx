export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-silver">MEDISENSE Command Layer</p>
        <h1 className="mt-3 font-arcadiaDisplay text-heading-lg font-light leading-[1.15] tracking-[0.01em] text-starlight md:text-display">{title}</h1>
        <p className="mt-4 max-w-2xl text-body text-silver">{subtitle}</p>
      </div>
    </div>
  );
}
