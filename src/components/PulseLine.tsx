"use client";

import { useEffect, useRef, useState } from "react";

type PulseLineProps = {
  /** proportion of hospitals flagged, e.g. 0.094 for 9.4% */
  flagRate: number;
  totalUnits?: number;
  className?: string;
  strokeColor?: string;
  height?: number;
};

/**
 * Signature visual for DigiCare Intelligence: an EKG-style waveform where
 * the sharp spikes are placed according to the real proportion of hospitals
 * flagged with "inefisiensi ganda" (double inefficiency). A calm, mostly-flat
 * line with occasional spikes mirrors the actual finding: most hospitals are
 * stable, a measurable minority are in the risk zone.
 */
export default function PulseLine({
  flagRate,
  totalUnits = 60,
  className = "",
  strokeColor = "#0F6B5C",
  height = 120,
}: PulseLineProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  const width = totalUnits * 14;
  const midY = height / 2;

  // Deterministic spike placement based on flagRate so the visual is
  // literally derived from the dataset, not decorative randomness.
  const spikeEvery = Math.max(2, Math.round(1 / Math.max(flagRate, 0.01)));

  let d = `M 0 ${midY}`;
  for (let i = 0; i < totalUnits; i++) {
    const x = i * 14;
    const isSpike = i > 0 && i % spikeEvery === 0;
    if (isSpike) {
      d += ` L ${x} ${midY}`;
      d += ` L ${x + 3} ${midY - height * 0.36}`;
      d += ` L ${x + 6} ${midY + height * 0.42}`;
      d += ` L ${x + 9} ${midY}`;
    } else {
      const wobble = Math.sin(i * 0.9) * 2.2;
      d += ` L ${x + 14} ${midY + wobble}`;
    }
  }

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [d]);

  return (
    <div className={`overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={`Garis vital menunjukkan ${(flagRate * 100).toFixed(1)} persen rumah sakit dalam kondisi berisiko`}
      >
        <path
          ref={pathRef}
          d={d}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: pathLength,
            strokeDashoffset: pathLength,
            animation: pathLength ? "draw-pulse 2.4s ease-out forwards" : undefined,
          }}
        />
      </svg>
      <style>{`
        @keyframes draw-pulse {
          to { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          path { animation: none !important; stroke-dashoffset: 0 !important; }
        }
      `}</style>
    </div>
  );
}
