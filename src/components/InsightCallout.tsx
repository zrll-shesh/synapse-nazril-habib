type InsightCalloutProps = {
  label?: string;
  children: React.ReactNode;
  tone?: "teal" | "amber" | "coral";
};

const TONE_MAP = {
  teal: { border: "border-teal", bg: "bg-teal-soft", text: "text-teal-deep" },
  amber: { border: "border-amber", bg: "bg-amber-soft", text: "text-ink" },
  coral: { border: "border-coral", bg: "bg-coral-soft", text: "text-ink" },
};

export default function InsightCallout({ label = "Insight", children, tone = "teal" }: InsightCalloutProps) {
  const styles = TONE_MAP[tone];
  return (
    <div className={`border-l-2 ${styles.border} ${styles.bg} rounded-r-md pl-5 pr-5 py-4 my-6`}>
      <p className={`eyebrow mb-1.5 ${styles.text}`}>{label}</p>
      <p className="font-body text-[0.95rem] leading-relaxed text-ink">{children}</p>
    </div>
  );
}
