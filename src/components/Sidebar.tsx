"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Ringkasan", tab: "RGK" },
  { href: "/pilar-1", label: "Audit Kematangan Digital", tab: "P1" },
  { href: "/pilar-2", label: "Dampak Operasional", tab: "P2" },
  { href: "/pilar-3", label: "Segmentasi & Bottleneck", tab: "P3" },
  { href: "/pilar-4", label: "Prediksi Risiko", tab: "P4" },
  { href: "/pilar-5", label: "Benchmark Model", tab: "P5" },
  { href: "/chat", label: "Tanya DigiCare", tab: "RAG" },
];

function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" fill="none" className="shrink-0">
      <circle cx="20" cy="20" r="19" stroke="#0F6B5C" strokeWidth="1.4" />
      <path
        d="M6 20 H13 L16 12 L20 28 L23 20 H34"
        stroke="#0F6B5C"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 border-r border-line bg-paper-card min-h-screen sticky top-0">
      <div className="px-6 pt-8 pb-6 flex items-center gap-3">
        <LogoMark />
        <div>
          <p className="eyebrow leading-none mb-1">Smart Hospital</p>
          <h1 className="font-display text-lg font-semibold leading-tight">DigiCare</h1>
        </div>
      </div>
      <div className="baseline-rule mx-6" />
      <nav className="flex-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`focus-ring group relative flex items-center gap-3 rounded-md px-3 py-2.5 mb-1 text-sm transition-all duration-150 ${
                active
                  ? "bg-teal text-paper-card shadow-[0_4px_12px_-4px_rgba(15,107,92,0.5)]"
                  : "text-ink-soft hover:bg-paper-dim hover:pl-4"
              }`}
            >
              {active && (
                <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-teal" />
              )}
              <span
                className={`font-mono text-[0.65rem] w-8 shrink-0 ${
                  active ? "text-paper-card/80" : "text-ink-soft/50"
                }`}
              >
                {item.tab}
              </span>
              <span className="font-body">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-5 border-t border-line">
        <p className="font-mono text-[0.65rem] text-ink-soft/60 leading-relaxed flex items-center gap-2">
          <span className="pulse-dot" />
          276 rumah sakit &middot; 35 provinsi
        </p>
        <p className="font-mono text-[0.65rem] text-ink-soft/60 mt-1">
          Data Analyst Competition 2026 (by Nazril and Habib)
        </p>
      </div>
    </aside>
  );
}
