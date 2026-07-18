import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import InsightCallout from "@/components/InsightCallout";
import DataTable from "@/components/DataTable";
import HorizontalBarChart from "@/components/charts/HorizontalBarChart";
import modelComparison from "@/data/pilar4_model_comparison.json";
import featureImportance from "@/data/pilar4_feature_importance.json";
import headline from "@/data/headline_stats.json";

const LABELS: Record<string, string> = {
  region_Jawa: "Region: Jawa",
  "kepemilikan_Bumn": "Kepemilikan: BUMN",
  region_Sumatera: "Region: Sumatera",
  "kepemilikan_Tni/Polri": "Kepemilikan: TNI/POLRI",
  "region_Bali & Nusa Tenggara": "Region: Bali & Nusa Tenggara",
  "region_Maluku & Papua": "Region: Maluku & Papua",
  kelas_rumah_sakit_D: "Kelas Rumah Sakit D",
  region_Sulawesi: "Region: Sulawesi",
  region_Kalimantan: "Region: Kalimantan",
  jumlah_tenaga_kerja: "Jumlah Tenaga Kerja",
  jumlah_jenis_layanan: "Jumlah Jenis Layanan",
  kelas_rumah_sakit_C: "Kelas Rumah Sakit C",
  kepemilikan_Swasta: "Kepemilikan: Swasta",
  jumlah_tempat_tidur: "Jumlah Tempat Tidur",
  "kepemilikan_Pemerintah Daerah": "Kepemilikan: Pemerintah Daerah",
  kelas_rumah_sakit_B: "Kelas Rumah Sakit B",
  "kepemilikan_Pemerintah Pusat": "Kepemilikan: Pemerintah Pusat",
  kelas_rumah_sakit_A: "Kelas Rumah Sakit A",
};

export default function Pilar4Page() {
  const featureChart = (featureImportance as any[])
    .slice(0, 12)
    .map((d) => ({ name: LABELS[d.Feature] ?? d.Feature, value: d.Importance, significant: true }))
    .sort((a, b) => a.value - b.value);

  return (
    <div>
      <SectionHeader
        eyebrow="Pilar 04 — Sistem Peringatan Dini Risiko"
        title="Mendeteksi rumah sakit berisiko sebelum data operasional tersedia"
        description="Model klasifikasi dibangun murni dari profil struktural rumah sakit — tanpa skor digital maupun variabel operasional — untuk menghindari kebocoran informasi."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatCard label="ROC-AUC" value={String(headline.pilar4.roc_auc)} tone="positive" />
        <StatCard label="Recall" value={`${(headline.pilar4.recall * 100).toFixed(0)}%`} tone="warning" note="Sebagian RS bermasalah masih terlewat" />
        <StatCard label="Precision" value={`${(headline.pilar4.precision * 100).toFixed(0)}%`} />
        <StatCard label="Model Terpilih" value="XGBoost" note="+ scale_pos_weight" />
      </div>

      <section className="mb-12">
        <p className="eyebrow mb-3">Perbandingan Model (StratifiedKFold 5-Fold)</p>
        <DataTable
          columns={["Model", "Precision", "Recall", "F1", "ROC-AUC"]}
          rows={(modelComparison as any[]).map((m) => [m.Model, m.Precision, m.Recall, m.F1, m["ROC-AUC"]])}
        />
      </section>

      <section className="mb-12">
        <p className="eyebrow mb-3">Sinyal Struktural Paling Berpengaruh</p>
        <HorizontalBarChart data={featureChart} valueLabel="Feature Importance" height={420} />
        <InsightCallout tone="amber">
          Tiga sinyal struktural paling berasosiasi dengan risiko tinggi adalah lokasi di region
          Jawa, kepemilikan BUMN, dan lokasi di region Sumatera. Rumah sakit dengan kapasitas fisik
          dan SDM terbatas, kelas lebih rendah, dan berlokasi di region dengan infrastruktur digital
          lebih terbatas secara konsisten menjadi sinyal risiko yang kuat.
        </InsightCallout>
      </section>

      <section>
        <p className="eyebrow mb-3">Keterbatasan yang Diungkap Secara Sengaja</p>
        <InsightCallout tone="coral">
          Recall 16% berarti sebagian besar rumah sakit bermasalah masih bisa terlewatkan (false
          negative). Model ini direkomendasikan sebagai <strong>lapisan pertama peringatan dini</strong>{" "}
          untuk memprioritaskan audit — bukan pengganti audit langsung atau alat keputusan tunggal.
        </InsightCallout>
      </section>
    </div>
  );
}
