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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 border-r border-line bg-paper-card min-h-screen sticky top-0">
      <div className="px-6 pt-8 pb-6">
        <p className="eyebrow">Konsorsium Smart Hospital</p>
        <h1 className="font-display text-xl font-semibold mt-1 leading-tight">
          DigiCare
          <br />
          Intelligence
        </h1>
      </div>
      <div className="baseline-rule mx-6" />
      <nav className="flex-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`focus-ring group flex items-center gap-3 rounded-md px-3 py-2.5 mb-1 text-sm transition-colors ${
                active
                  ? "bg-teal text-paper-card"
                  : "text-ink-soft hover:bg-paper-dim"
              }`}
            >
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
        <p className="font-mono text-[0.65rem] text-ink-soft/60 leading-relaxed">
          276 rumah sakit &middot; 35 provinsi
          <br />
          Data Analyst Competition 2026
        </p>
      </div>
    </aside>
  );
}
