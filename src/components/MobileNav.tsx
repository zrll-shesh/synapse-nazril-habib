"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Ringkasan" },
  { href: "/pilar-1", label: "Pilar 1 · Audit Digital" },
  { href: "/pilar-2", label: "Pilar 2 · Dampak Operasional" },
  { href: "/pilar-3", label: "Pilar 3 · Segmentasi" },
  { href: "/pilar-4", label: "Pilar 4 · Prediksi Risiko" },
  { href: "/pilar-5", label: "Pilar 5 · Benchmark Model" },
  { href: "/chat", label: "Tanya DigiCare" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = NAV_ITEMS.find((n) => n.href === pathname)?.label ?? "Ringkasan";

  return (
    <div className="lg:hidden sticky top-0 z-20 bg-paper-card/95 backdrop-blur-sm border-b border-line">
      <button
        onClick={() => setOpen(!open)}
        className="focus-ring w-full flex items-center justify-between px-5 py-4"
        aria-expanded={open}
      >
        <span className="font-display font-semibold text-sm flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="19" stroke="#0F6B5C" strokeWidth="1.6" />
            <path d="M6 20 H13 L16 12 L20 28 L23 20 H34" stroke="#0F6B5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          DigiCare &middot; <span className="text-teal">{current}</span>
        </span>
        <span className="font-mono text-xs text-ink-soft">{open ? "TUTUP" : "MENU"}</span>
      </button>
      {open && (
        <nav className="px-3 pb-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2.5 text-sm font-body transition-colors ${
                pathname === item.href ? "bg-teal text-paper-card" : "text-ink-soft hover:bg-paper-dim"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
