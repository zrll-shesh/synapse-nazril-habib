type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

export default function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  const match = eyebrow.match(/(\d+)/);
  const badge = match ? match[1].padStart(2, "0") : null;
  const label = badge ? eyebrow.replace(/Pilar\s*0*\d+\s*?\s*/i, "").trim() : eyebrow;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-3">
        {badge && <span className="pillar-badge">{badge}</span>}
        <p className="eyebrow">{badge ? label : eyebrow}</p>
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink leading-tight">
        {title}
      </h1>
      {description && (
        <p className="font-body text-ink-soft text-base mt-3 max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
      <div className="baseline-rule mt-6" />
    </div>
  );
}
