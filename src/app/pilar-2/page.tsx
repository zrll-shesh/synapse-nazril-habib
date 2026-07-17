import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import InsightCallout from "@/components/InsightCallout";
import DataTable from "@/components/DataTable";
import HorizontalBarChart from "@/components/charts/HorizontalBarChart";
import koefA from "@/data/pilar2_koef_targetA.json";
import shapA from "@/data/pilar2_shap_targetA.json";
import shapB from "@/data/pilar2_shap_targetB.json";
import metrics from "@/data/pilar2_metrics_comparison.json";
import highlights from "@/data/pilar2_highlights.json";

const LABELS: Record<string, string> = {
  jumlah_tempat_tidur: "Jumlah Tempat Tidur",
  jumlah_jenis_layanan: "Jumlah Jenis Layanan",
  jumlah_tenaga_kerja: "Jumlah Tenaga Kerja",
  tingkat_keterisian_tempat_tidur_persen: "Tingkat Keterisian TT (BOR)",
  kunjungan_pasien_per_bulan: "Kunjungan Pasien/Bulan",
  rasio_adopsi_telemedicine: "Rasio Adopsi Telemedicine",
  digital_gap_score: "Gap Skor Digital",
  jumlah_perangkat_iot: "Jumlah Perangkat IoT",
  jumlah_staf_it: "Jumlah Staf IT",
  anggaran_it_tahunan_juta_rupiah: "Anggaran IT Tahunan",
  status_implementasi_rme_enc: "Implementasi RME",
  status_terhubung_satusehat_enc: "Terhubung SatuSehat",
};

export default function Pilar2Page() {
  const coefChartData = (koefA as any[])
    .filter((d) => d.Feature !== "const" && !d.Feature.startsWith("kelas_") && !d.Feature.startsWith("kepemilikan_") && !d.Feature.startsWith("region_"))
    .map((d) => ({ name: LABELS[d.Feature] ?? d.Feature, value: d.Coefficient, significant: d.Sig_p05 }))
    .sort((a, b) => a.value - b.value);

  const shapChartA = (shapA as any[])
    .slice(0, 8)
    .map((d) => ({ name: LABELS[d.Feature] ?? d.Feature, value: d.MeanAbsSHAP, significant: true }))
    .sort((a, b) => a.value - b.value);

  return (
    <div>
      <SectionHeader
        eyebrow="Pilar 02  Dampak Operasional"
        title="Digitalisasi mempercepat respons, tapi tidak memperpendek rawat inap"
        description="Dua target diuji terpisah dengan OLS dan XGBoost + SHAP: waktu respons rujukan (Target A) dan lama rawat inap / LOS (Target B)."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
        <StatCard label="Efek Gap Digital → Respons" value="-3.3" unit="menit/10 poin" tone="positive" note="Signifikan, p<0.05" />
        <StatCard label="Efek Gap Digital → LOS" value="-0.075" unit="hari/10 poin" tone="warning" note="Tidak signifikan, p=0.456" />
        <StatCard label="R² OLS Waktu Respons" value="0.199" note="In-sample, adj. R² 0.122" />
      </div>

      <section className="mb-12">
        <p className="eyebrow mb-3">6.1 Target A  Waktu Respons Rujukan (OLS)</p>
        <p className="font-body text-ink-soft mb-4 leading-relaxed max-w-2xl">
          Koefisien regresi terhadap waktu respons rujukan (menit). Nilai negatif berarti fitur
          tersebut berasosiasi dengan respons yang lebih cepat.
        </p>
        <HorizontalBarChart data={coefChartData} valueLabel="Koefisien (menit)" height={420} />
        <InsightCallout tone="teal">
          Gap skor digital (relatif terhadap rata-rata kelas rumah sakit) adalah satu-satunya
          variabel digital yang signifikan: setiap kenaikan 10 poin berasosiasi dengan waktu respons
          3.3 menit lebih cepat. Status SatuSehat dan RME tidak terbukti signifikan.
        </InsightCallout>
      </section>

      <section className="mb-12">
        <p className="eyebrow mb-3">6.2 Kontribusi Fitur (SHAP)  Target A</p>
        <HorizontalBarChart
          data={shapChartA}
          valueLabel="Mean |SHAP|"
          positiveColor="#0F6B5C"
          negativeColor="#0F6B5C"
        />
        <p className="font-body text-sm text-ink-soft mt-3 max-w-2xl">
          Infrastruktur digital (IoT, staf IT, anggaran IT) konsisten berasosiasi dengan kecepatan
          respons yang lebih baik menurut analisis SHAP pada model XGBoost.
        </p>
      </section>

      <section className="mb-12">
        <p className="eyebrow mb-3">6.3 Target B  Lama Rawat Inap (LOS): Klaim Tidak Terbukti</p>
        <InsightCallout tone="coral">
          Berbeda dengan waktu respons, LOS tidak berasosiasi secara statistik dengan variabel
          digital apa pun setelah multikolinearitas dikoreksi. Digitalisasi berdampak pada{" "}
          <strong>kecepatan proses layanan</strong>, bukan pada <strong>durasi klinis perawatan</strong>{" "}
           LOS lebih ditentukan oleh kelas RS, BOR, dan tingkat keparahan penyakit. Ini bukan
          kelemahan, melainkan kejujuran metodologis yang memperkuat kredibilitas temuan Target A.
        </InsightCallout>
      </section>

      <section className="mb-12">
        <p className="eyebrow mb-3">Ringkasan Efek Khusus</p>
        <DataTable
          columns={["Variabel", "Target", "Efek (Koefisien OLS)", "Signifikansi"]}
          rows={(highlights as any[]).map((h) => [
            h.Variabel,
            h.Target,
            h["Efek (OLS Koef)"],
            h.Signifikansi.trim(),
          ])}
        />
      </section>

      <section>
        <p className="eyebrow mb-3">Perbandingan Model: OLS vs XGBoost</p>
        <DataTable
          columns={["Target", "Model", "R²", "Adj. R²", "RMSE", "MAE"]}
          rows={(metrics as any[]).map((m) => [m.Target, m.Model, m.R2, m["Adj.R2"], m.RMSE, m.MAE])}
          caption="Model regresi linear (OLS) lebih unggul dibanding XGBoost pada data berukuran terbatas ini"
        />
      </section>
    </div>
  );
}
