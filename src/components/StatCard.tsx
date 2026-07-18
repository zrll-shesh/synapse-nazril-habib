type StatCardProps = {
  label: string;
  value: string;
  unit?: string;
  tone?: "default" | "positive" | "warning" | "critical";
  note?: string;
};

const TONE_STYLES: Record<string, { text: string; bar: string }> = {
  default: { text: "text-ink", bar: "bg-ink-soft/30" },
  positive: { text: "text-teal", bar: "bg-teal" },
  warning: { text: "text-amber", bar: "bg-amber" },
  critical: { text: "text-coral", bar: "bg-coral" },
};

export default function StatCard({ label, value, unit, tone = "default", note }: StatCardProps) {
  const styles = TONE_STYLES[tone];
  return (
    <div className="card-surface card-surface-interactive relative overflow-hidden px-5 py-4 flex flex-col gap-1.5">
      <span className={`absolute left-0 top-0 h-full w-[3px] ${styles.bar}`} />
      <span className="eyebrow">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-mono text-3xl font-medium tabular-nums ${styles.text}`}>{value}</span>
        {unit && <span className="font-mono text-sm text-ink-soft">{unit}</span>}
      </div>
      {note && <p className="font-body text-sm text-ink-soft leading-snug">{note}</p>}
    </div>
  );
}
