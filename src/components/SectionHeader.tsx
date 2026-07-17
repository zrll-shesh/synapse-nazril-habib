type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

export default function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-8">
      <p className="eyebrow mb-2">{eyebrow}</p>
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
