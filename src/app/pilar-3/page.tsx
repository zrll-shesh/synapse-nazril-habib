import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import InsightCallout from "@/components/InsightCallout";
import ClusterScatterChart from "@/components/charts/ClusterScatterChart";
import HospitalRosterTable from "@/components/HospitalRosterTable";
import DataTable from "@/components/DataTable";
import clusterProfile from "@/data/pilar3_cluster_profile.json";
import umapData from "@/data/pilar3_umap_scatter.json";
import hospitalAssignment from "@/data/pilar3_hospital_assignment.json";
import ownershipByCluster from "@/data/pilar3_ownership_by_cluster.json";
import regionByCluster from "@/data/pilar3_region_by_cluster.json";
import alternativeSegmentation from "@/data/pilar3_alternative_segmentation.json";
import headline from "@/data/headline_stats.json";

const CLUSTER_COLORS = ["#0F6B5C", "#8C8672"];

export default function Pilar3Page() {
  const scatterData = (umapData as any[]).map((d) => ({
    x: d.umap_x,
    y: d.umap_y,
    cluster: d.cluster,
    name: d.nama_rumah_sakit,
    flagged: d.flag_double_inefficiency === 1,
  }));

  return (
    <div>
      <SectionHeader
        eyebrow="Pilar 03  Segmentasi & Deteksi Bottleneck"
        title="Klaster Digital Frontier tidak pernah mengalami inefisiensi ganda"
        description="Pencarian kombinatorial menyeluruh terhadap ribuan kombinasi fitur, scaler, reduksi dimensi, dan algoritma menghasilkan segmentasi dengan pemisahan statistik terkuat yang bisa dicapai pada data ini."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatCard label="Silhouette Score" value={String(headline.pilar3.silhouette)} tone="positive" note="Di atas ambang struktur kuat 0.5" />
        <StatCard label="Calinski-Harabasz" value={String(headline.pilar3.calinski_harabasz)} />
        <StatCard label="Davies-Bouldin" value={String(headline.pilar3.davies_bouldin)} note="Makin rendah makin baik" />
        <StatCard label="Rumah Sakit Ter-flag" value={String(headline.pilar3.n_flagged)} tone="critical" note={`${headline.pilar3.flag_rate_overall}% dari populasi`} />
      </div>

      <section className="mb-12">
        <p className="eyebrow mb-3">Peta Segmentasi (UMAP, diwarnai berdasarkan klaster)</p>
        <div className="bg-paper-card border border-line rounded-lg p-4">
          <ClusterScatterChart data={scatterData} clusterColors={CLUSTER_COLORS} />
        </div>
        <div className="flex gap-6 mt-3 font-mono text-xs text-ink-soft">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: CLUSTER_COLORS[0] }} />
            Digital Frontier (n={(clusterProfile as any[])[0].jumlah_rs})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: CLUSTER_COLORS[1] }} />
            Mainstream (n={(clusterProfile as any[])[1].jumlah_rs})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block border-2 border-coral" />
            Flag inefisiensi ganda
          </span>
        </div>
      </section>

      <section className="mb-12">
        <p className="eyebrow mb-3">Profil Karakteristik Klaster</p>
        <div className="grid md:grid-cols-2 gap-4">
          {(clusterProfile as any[]).map((c) => (
            <div key={c.cluster} className="bg-paper-card border border-line rounded-lg p-5">
              <p className="font-mono text-xs text-ink-soft mb-1">
                Klaster {c.cluster} &middot; n={c.jumlah_rs}
              </p>
              <h3 className="font-display text-lg font-semibold mb-3">
                {c.cluster === 0 ? "Digital Frontier" : "Mainstream Operations"}
              </h3>
              <dl className="space-y-1.5 font-mono text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Skor Digital</dt>
                  <dd>{c.skor_kematangan_digital.toFixed(1)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Waktu Respons</dt>
                  <dd>{c.rata_rata_waktu_respons_rujukan_menit.toFixed(1)} menit</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Adopsi Telemedicine</dt>
                  <dd>{(c.rasio_adopsi_telemedicine * 100).toFixed(1)}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Tingkat Inefisiensi Ganda</dt>
                  <dd className={c.flag_double_inefficiency === 0 ? "text-teal font-semibold" : "text-coral font-semibold"}>
                    {(c.flag_double_inefficiency * 100).toFixed(1)}%
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
        <InsightCallout tone="teal">
          Klaster Digital Frontier (beban kerja SDM efisien + adopsi telemedicine tinggi) memiliki
          tingkat inefisiensi ganda 0%  tidak satu pun dari 26 rumah sakit di klaster ini pernah
          ter-flag, dibanding 10.4% pada klaster Mainstream. Flag ini dihitung independen dari proses
          clustering, sehingga korelasi ini menjadi validasi silang yang kuat.
        </InsightCallout>
      </section>

      <section className="mb-12">
        <p className="eyebrow mb-3">Komposisi Kepemilikan &amp; Region per Klaster</p>
        <div className="grid md:grid-cols-2 gap-4">
          <DataTable
            columns={["Klaster", "BUMN", "Pemda", "Pempus", "Swasta", "TNI/POLRI"]}
            rows={(ownershipByCluster as any[]).map((o) => [
              o.cluster === 0 ? "Digital Frontier" : "Mainstream",
              o.Bumn,
              o["Pemerintah Daerah"],
              o["Pemerintah Pusat"],
              o.Swasta,
              o["Tni/Polri"],
            ])}
          />
          <DataTable
            columns={["Klaster", "Jawa", "Sumatera", "Kalimantan", "Sulawesi", "Bali & NT", "Maluku & Papua"]}
            rows={(regionByCluster as any[]).map((r) => [
              r.cluster === 0 ? "Digital Frontier" : "Mainstream",
              r.Jawa,
              r.Sumatera,
              r.Kalimantan,
              r.Sulawesi,
              r["Bali & Nusa Tenggara"],
              r["Maluku & Papua"],
            ])}
          />
        </div>
        <p className="font-body text-sm text-ink-soft mt-3 max-w-2xl">
          Klaster Digital Frontier didominasi rumah sakit Jawa dan Swasta/Pemerintah Daerah, namun
          tetap ada representasi dari hampir semua kepemilikan dan region  menandakan posisi
          Digital Frontier bisa dicapai lintas struktur, bukan eksklusif milik satu jenis rumah sakit.
        </p>
      </section>

      <section className="mb-12">
        <p className="eyebrow mb-3">Transparansi Pemilihan Model: Solusi Alternatif k &ge; 3</p>
        <p className="font-body text-ink-soft mb-4 leading-relaxed max-w-2xl">
          Lima kombinasi terbaik dengan jumlah klaster lebih banyak (k &ge; 3) dari pencarian
          kombinatorial yang sama, ditampilkan sebagai pembanding.
        </p>
        <DataTable
          columns={["Fitur", "k", "Metode", "Silhouette", "Calinski-Harabasz", "Davies-Bouldin"]}
          rows={(alternativeSegmentation as any[]).map((a) => [
            a.features.split(",").length > 2 ? `${a.features.split(",").length} fitur` : a.features,
            a.k,
            a.method,
            a.silhouette.toFixed(3),
            a.calinski.toFixed(1),
            a.davies_bouldin.toFixed(3),
          ])}
          caption="Semua solusi k >= 3 secara konsisten berada di bawah ambang silhouette 0.5"
        />
        <InsightCallout tone="amber">
          Solusi k=2 (silhouette {headline.pilar3.silhouette}) dipilih bukan karena dicari-cari,
          melainkan karena seluruh alternatif dengan segmen lebih banyak (k≥3) pada data ini secara
          konsisten menghasilkan pemisahan yang lebih lemah (silhouette tertinggi hanya 0.475). Ini
          realitas struktur data: dua kelompok besar memang terpisah lebih jelas dibanding pemecahan
          menjadi tiga kelompok atau lebih.
        </InsightCallout>
      </section>

      <section>
        <p className="eyebrow mb-3">Daftar Lengkap 276 Rumah Sakit</p>
        <HospitalRosterTable data={hospitalAssignment as any[]} />
      </section>
    </div>
  );
}
