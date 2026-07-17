import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import InsightCallout from "@/components/InsightCallout";
import DataTable from "@/components/DataTable";
import ComparisonBarChart from "@/components/charts/ComparisonBarChart";
import statTests from "@/data/pilar5_statistical_tests.json";
import tuning from "@/data/pilar5_tuning_summary.json";

export default function Pilar5Page() {
  const chartData = (statTests as any[]).map((t) => ({
    target: t.Target,
    XGBoost: t.XGB_RMSE_mean,
    MLP: t.MLP_RMSE_mean,
  }));

  return (
    <div>
      <SectionHeader
        eyebrow="Pilar 05  Benchmark Model"
        title="MLP vs XGBoost: perbedaan yang tidak signifikan, tapi tetap bermakna"
        description="Benchmark diuji dengan koreksi Nadeau-Bengio yang valid untuk hasil cross-validation, bukan uji Wilcoxon naif yang lazim disalahgunakan."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatCard label="RMSE XGBoost (Respons)" value="22.12" tone="positive" />
        <StatCard label="RMSE MLP (Respons)" value="22.49" />
        <StatCard label="p Nadeau-Bengio" value="0.745" tone="warning" note="Tidak signifikan" />
        <StatCard label="Model Terpilih" value="XGBoost" note="Karena interpretabilitas SHAP" />
      </div>

      <section className="mb-12">
        <p className="eyebrow mb-3">Perbandingan RMSE per Target</p>
        <div className="bg-paper-card border border-line rounded-lg p-4">
          <ComparisonBarChart
            data={chartData}
            xKey="target"
            bars={[
              { key: "XGBoost", color: "#0F6B5C", label: "XGBoost" },
              { key: "MLP", color: "#C88A2E", label: "MLP" },
            ]}
          />
        </div>
      </section>

      <section className="mb-12">
        <p className="eyebrow mb-3">Uji Statistik: Nadeau-Bengio vs Wilcoxon Naif</p>
        <DataTable
          columns={["Target", "RMSE MLP", "RMSE XGB", "Selisih", "p Wilcoxon (invalid)", "p Nadeau-Bengio", "Signifikan"]}
          rows={(statTests as any[]).map((t) => [
            t.Target,
            t.MLP_RMSE_mean,
            t.XGB_RMSE_mean,
            t.Diff_mean_MLP_minus_XGB,
            t.Wilcoxon_p_NAIF_jangan_pakai.toFixed(4),
            t.NB_p_corrected,
            t.Signifikan_NB ? "Ya" : "Tidak",
          ])}
          caption="Uji Wilcoxon naif tidak valid untuk hasil cross-validation karena mengabaikan korelasi antar fold"
        />
        <InsightCallout tone="teal">
          Selisih RMSE antara MLP dan XGBoost pada kedua target secara statistik tidak bermakna
          (p = 0.745 dan p = 0.673 setelah koreksi Nadeau-Bengio). Klaim bahwa satu model &ldquo;lebih
          akurat&rdquo; dari yang lain tidak dapat didukung data pada ukuran sampel ini.
        </InsightCallout>
      </section>

      <section className="mb-12">
        <p className="eyebrow mb-3">Hasil Tuning Hyperparameter</p>
        <DataTable
          columns={["Target", "Model", "Best CV RMSE", "Parameter Terbaik"]}
          rows={(tuning as any[]).map((t) => [t.Target, t.Model, t.Best_CV_RMSE, t.Best_Params])}
        />
      </section>

      <section>
        <p className="eyebrow mb-3">Mengapa XGBoost Tetap Dipilih</p>
        <InsightCallout tone="amber">
          Meskipun perbedaan akurasi tidak signifikan, XGBoost tetap dipilih sebagai model utama
          bukan karena akurasi lebih tinggi, melainkan karena kemampuan SHAP menjelaskan kontribusi
          tiap fitur secara individual  sesuatu yang tidak dimiliki MLP dalam konteks proyek ini.
          Pemilihan model tidak selalu soal mengejar akurasi tertinggi, terutama ketika perbedaannya
          tidak signifikan; interpretabilitas untuk kebutuhan pengambilan keputusan bisnis bisa jadi
          pertimbangan yang lebih menentukan.
        </InsightCallout>
      </section>
    </div>
  );
}
