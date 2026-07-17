import Link from "next/link";
import PulseLine from "@/components/PulseLine";
import StatCard from "@/components/StatCard";
import headline from "@/data/headline_stats.json";

const PILAR_CARDS = [
  {
    href: "/pilar-1",
    tab: "Pilar 01",
    title: "Audit Kematangan Digital",
    desc: "Model struktural vs investasi menjawab: apa yang benar-benar membentuk skor digital rumah sakit?",
    stat: `R² struktural ${headline.pilar1.r2_struktural}`,
  },
  {
    href: "/pilar-2",
    tab: "Pilar 02",
    title: "Dampak Operasional",
    desc: "Digitalisasi mempercepat respons rujukan, tapi tidak memperpendek lama rawat inap.",
    stat: `-3.3 menit / +10 poin skor digital`,
  },
  {
    href: "/pilar-3",
    tab: "Pilar 03",
    title: "Segmentasi & Bottleneck",
    desc: "Klaster Digital Frontier tidak pernah mengalami inefisiensi ganda satu pun.",
    stat: `Silhouette ${headline.pilar3.silhouette}`,
  },
  {
    href: "/pilar-4",
    tab: "Pilar 04",
    title: "Prediksi Risiko",
    desc: "Sinyal struktural mendeteksi rumah sakit berisiko sebelum data operasional tersedia.",
    stat: `ROC-AUC ${headline.pilar4.roc_auc}`,
  },
  {
    href: "/pilar-5",
    tab: "Pilar 05",
    title: "Benchmark Model",
    desc: "MLP vs XGBoost diuji dengan koreksi Nadeau-Bengio, bukan uji naif yang menyesatkan.",
    stat: `Selisih RMSE tidak signifikan`,
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="mb-14">
        <p className="eyebrow mb-3">Konsorsium Smart Hospital Nusantara &middot; Ringkasan Eksekutif</p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-[1.05] max-w-3xl">
          Apakah investasi digital rumah sakit benar-benar mengubah cara pasien dilayani?
        </h1>
        <p className="font-body text-ink-soft text-lg mt-5 max-w-2xl leading-relaxed">
          Lima pilar analisis menelusuri 276 rumah sakit di 35 provinsi untuk memisahkan korelasi
          semu dari dampak nyata, lalu menandai rumah sakit mana yang berada dalam zona{" "}
          <span className="text-coral font-medium">inefisiensi ganda</span>.
        </p>

        <div className="mt-10 border border-line rounded-lg bg-paper-card px-6 py-5">
          <div className="flex items-center justify-between mb-1">
            <p className="eyebrow">Denyut Populasi &middot; 276 Rumah Sakit</p>
            <p className="font-mono text-xs text-ink-soft">
              {headline.pilar3.flag_rate_overall}% ter-flag inefisiensi ganda
            </p>
          </div>
          <PulseLine flagRate={headline.pilar3.flag_rate_overall / 100} height={110} />
          <p className="font-mono text-[0.65rem] text-ink-soft/60 mt-1">
            setiap lonjakan tajam merepresentasikan proporsi riil rumah sakit berisiko dalam populasi
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14">
        <StatCard
          label="Rumah Sakit Dianalisis"
          value={String(headline.jumlah_rumah_sakit)}
          note={`Tersebar di ${headline.jumlah_provinsi} provinsi`}
        />
        <StatCard
          label="Inefisiensi Ganda"
          value={String(headline.pilar3.n_flagged)}
          unit="RS"
          tone="critical"
          note={`${headline.pilar3.flag_rate_overall}% dari populasi`}
        />
        <StatCard
          label="Silhouette Segmentasi"
          value={String(headline.pilar3.silhouette)}
          tone="positive"
          note="Di atas ambang struktur kuat 0.5"
        />
        <StatCard
          label="ROC-AUC Model Risiko"
          value={String(headline.pilar4.roc_auc)}
          tone="warning"
          note="Recall 16%  lapisan pertama, bukan final"
        />
      </section>

      <section>
        <p className="eyebrow mb-4">Lima Pilar Analisis</p>
        <div className="grid md:grid-cols-2 gap-4">
          {PILAR_CARDS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="focus-ring group border border-line bg-paper-card rounded-lg p-6 hover:border-teal transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[0.7rem] tracking-widest text-ink-soft/60">
                  {p.tab}
                </span>
                <span className="font-mono text-[0.7rem] text-teal opacity-0 group-hover:opacity-100 transition-opacity">
                  BUKA &rarr;
                </span>
              </div>
              <h2 className="font-display text-lg font-semibold mb-2">{p.title}</h2>
              <p className="font-body text-sm text-ink-soft leading-relaxed mb-3">{p.desc}</p>
              <p className="font-mono text-xs text-teal-deep">{p.stat}</p>
            </Link>
          ))}
          <Link
            href="/chat"
            className="focus-ring group border border-teal bg-teal-soft rounded-lg p-6 flex flex-col justify-center items-start"
          >
            <span className="font-mono text-[0.7rem] tracking-widest text-teal-deep/70 mb-3">
              RAG ASSISTANT
            </span>
            <h2 className="font-display text-lg font-semibold mb-2">Tanya DigiCare</h2>
            <p className="font-body text-sm text-ink-soft leading-relaxed">
              Ajukan pertanyaan bebas tentang temuan kelima pilar, dijawab berbasis dokumen insight asli.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
