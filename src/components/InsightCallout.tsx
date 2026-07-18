type InsightCalloutProps = {
  label?: string;
  children: React.ReactNode;
  tone?: "teal" | "amber" | "coral";
};

const TONE_MAP = {
  teal: { border: "border-teal", bg: "bg-teal-soft", text: "text-teal-deep", icon: "#0F6B5C" },
  amber: { border: "border-amber", bg: "bg-amber-soft", text: "text-ink", icon: "#C88A2E" },
  coral: { border: "border-coral", bg: "bg-coral-soft", text: "text-ink", icon: "#B8493F" },
};

export default function InsightCallout({ label = "Insight", children, tone = "teal" }: InsightCalloutProps) {
  const styles = TONE_MAP[tone];
  return (
    <div className={`relative border-l-2 ${styles.border} ${styles.bg} rounded-r-md pl-5 pr-5 py-4 my-6 shadow-[0_1px_2px_rgba(22,33,29,0.04)]`}>
      <div className="flex items-center gap-2 mb-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path
            d="M12 2 L20 6 V12 C20 17 16.5 20.5 12 22 C7.5 20.5 4 17 4 12 V6 L12 2 Z"
            stroke={styles.icon}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M9 12 L11 14 L15.5 9.5" stroke={styles.icon} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className={`eyebrow ${styles.text}`}>{label}</p>
      </div>
      <p className="font-body text-[0.95rem] leading-relaxed text-ink">{children}</p>
    </div>
  );
}
