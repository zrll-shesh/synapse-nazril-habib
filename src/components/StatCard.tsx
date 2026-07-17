type StatCardProps = {
  label: string;
  value: string;
  unit?: string;
  tone?: "default" | "positive" | "warning" | "critical";
  note?: string;
};

const TONE_STYLES: Record<string, string> = {
  default: "text-ink",
  positive: "text-teal",
  warning: "text-amber",
  critical: "text-coral",
};

export default function StatCard({ label, value, unit, tone = "default", note }: StatCardProps) {
  return (
    <div className="bg-paper-card border border-line rounded-lg px-5 py-4 flex flex-col gap-1.5">
      <span className="eyebrow">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-mono text-3xl font-medium ${TONE_STYLES[tone]}`}>{value}</span>
        {unit && <span className="font-mono text-sm text-ink-soft">{unit}</span>}
      </div>
      {note && <p className="font-body text-sm text-ink-soft leading-snug">{note}</p>}
    </div>
  );
}
