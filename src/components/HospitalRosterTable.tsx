"use client";

import { useMemo, useState } from "react";

type Hospital = {
  nama_rumah_sakit: string;
  provinsi: string;
  region: string;
  kelas_rumah_sakit: string;
  kepemilikan: string;
  skor_kematangan_digital: number;
  rata_rata_waktu_respons_rujukan_menit: number;
  flag_double_inefficiency: number;
  cluster: number;
};

const CLUSTER_LABELS: Record<number, string> = {
  0: "Digital Frontier",
  1: "Mainstream",
};

const CLUSTER_COLORS: Record<number, string> = {
  0: "text-teal-deep bg-teal-soft",
  1: "text-ink-soft bg-paper-dim",
};

export default function HospitalRosterTable({ data }: { data: Hospital[] }) {
  const [query, setQuery] = useState("");
  const [clusterFilter, setClusterFilter] = useState<"all" | number>("all");
  const [flagOnly, setFlagOnly] = useState(false);

  const filtered = useMemo(() => {
    return data.filter((h) => {
      if (query && !h.nama_rumah_sakit.toLowerCase().includes(query.toLowerCase())) return false;
      if (clusterFilter !== "all" && h.cluster !== clusterFilter) return false;
      if (flagOnly && h.flag_double_inefficiency !== 1) return false;
      return true;
    });
  }, [data, query, clusterFilter, flagOnly]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Cari nama rumah sakit..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="focus-ring font-body text-sm px-3 py-2 rounded-md border border-line bg-paper-card flex-1 min-w-[200px]"
        />
        <select
          value={clusterFilter}
          onChange={(e) => setClusterFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="focus-ring font-mono text-xs px-3 py-2 rounded-md border border-line bg-paper-card"
        >
          <option value="all">Semua Klaster</option>
          <option value={0}>Digital Frontier</option>
          <option value={1}>Mainstream</option>
        </select>
        <button
          onClick={() => setFlagOnly(!flagOnly)}
          className={`focus-ring font-mono text-xs px-3 py-2 rounded-md border transition-colors ${
            flagOnly ? "bg-coral text-paper-card border-coral" : "bg-paper-card border-line text-ink-soft"
          }`}
        >
          Hanya Inefisiensi Ganda
        </button>
      </div>

      <p className="font-mono text-xs text-ink-soft mb-2">
        Menampilkan {filtered.length} dari {data.length} rumah sakit
      </p>

      <div className="bg-paper-card border border-line rounded-lg overflow-hidden">
        <div className="overflow-auto max-h-[520px]">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rumah Sakit</th>
                <th>Provinsi</th>
                <th>Kelas</th>
                <th>Kepemilikan</th>
                <th>Skor Digital</th>
                <th>Respons (menit)</th>
                <th>Klaster</th>
                <th>Flag</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((h, i) => (
                <tr key={i}>
                  <td>{h.nama_rumah_sakit}</td>
                  <td>{h.provinsi}</td>
                  <td>{h.kelas_rumah_sakit}</td>
                  <td>{h.kepemilikan}</td>
                  <td>{h.skor_kematangan_digital.toFixed(1)}</td>
                  <td>{h.rata_rata_waktu_respons_rujukan_menit.toFixed(1)}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[0.7rem] ${CLUSTER_COLORS[h.cluster]}`}>
                      {CLUSTER_LABELS[h.cluster]}
                    </span>
                  </td>
                  <td>
                    {h.flag_double_inefficiency === 1 ? (
                      <span className="text-coral font-medium">Ya</span>
                    ) : (
                      <span className="text-ink-soft/50">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 200 && (
          <p className="font-mono text-[0.65rem] text-ink-soft/60 px-4 py-2 border-t border-line">
            Menampilkan 200 baris pertama. Persempit pencarian untuk melihat lebih spesifik.
          </p>
        )}
      </div>
    </div>
  );
}
