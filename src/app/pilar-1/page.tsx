import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import InsightCallout from "@/components/InsightCallout";
import DataTable from "@/components/DataTable";
import HorizontalBarChart from "@/components/charts/HorizontalBarChart";
import structural from "@/data/pilar1_coefficients_structural.json";
import investment from "@/data/pilar1_coefficients_investment.json";
import vifStructural from "@/data/pilar1_vif_structural.json";
import regionGap from "@/data/pilar1_region_gap.json";
import headline from "@/data/headline_stats.json";

export default function Pilar1Page() {
  const maxVif = Math.max(...vifStructural.map((v: any) => v.VIF).filter((v: number) => v < 100));

  return (
    <div>
      <SectionHeader
        eyebrow="Pilar 01  Audit Kematangan Digital"
        title="Apa yang sebenarnya membentuk skor kematangan digital?"
        description="Dua model dijalankan terpisah untuk menghindari klaim sebab-akibat yang keliru: model struktural menjelaskan skor digital dari kelas, kepemilikan, dan lokasi; model investasi menjelaskan skor digital dari sumber daya IT."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatCard label="R² Model Struktural" value={String(headline.pilar1.r2_struktural)} tone="default" />
        <StatCard label="R² Model Investasi" value={String(headline.pilar1.r2_investasi)} tone="positive" />
        <StatCard label="VIF Maksimum" value={String(headline.pilar1.vif_max_struktural)} note="Di bawah ambang 10, aman" />
        <StatCard
          label="Gap Timur vs Barat"
          value={String(headline.pilar1.gap_digital_timur_barat)}
          unit="poin"
          tone="critical"
        />
      </div>

      <section className="mb-12">
        <p className="eyebrow mb-3">6.1 Model Struktural  Kelas, Kepemilikan, Region</p>
        <p className="font-body text-ink-soft mb-4 leading-relaxed max-w-2xl">
          Model ini menjawab: seberapa besar skor digital sebuah rumah sakit ditentukan oleh
          hal-hal yang tidak bisa diubah lewat kebijakan jangka pendek  kelasnya, siapa
          pemiliknya, dan di wilayah mana ia berada.
        </p>
        <HorizontalBarChart
          data={structural.map((d: any) => ({ name: d.name, value: d.value, significant: d.significant }))}
          valueLabel="Perubahan skor digital"
        />
        <InsightCallout tone="coral">
          Region adalah faktor struktural paling dominan: rumah sakit di Jawa memiliki skor digital
          rata-rata 32.25 poin lebih tinggi dibanding kelompok acuan, sementara Kelas D tertinggal
          13.11 poin. Kesenjangan digital rumah sakit Indonesia lebih banyak dijelaskan oleh{" "}
          <em>di mana dan kelas apa</em> sebuah rumah sakit berada, dibanding keputusan manajemen
          jangka pendek.
        </InsightCallout>
      </section>

      <section className="mb-12">
        <p className="eyebrow mb-3">6.2 Model Investasi  Konteks Pendukung</p>
        <p className="font-body text-ink-soft mb-4 leading-relaxed max-w-2xl">
          Model ini ditempatkan sebagai konteks, bukan klaim sebab-akibat independen, karena skor
          digital kemungkinan besar adalah turunan langsung dari keempat variabel investasi ini.
        </p>
        <HorizontalBarChart
          data={investment.map((d: any) => ({ name: d.name, value: d.value, significant: d.significant }))}
          valueLabel="Koefisien"
        />
        <InsightCallout tone="teal">
          Keempat variabel investasi IT menjelaskan {headline.pilar1.r2_investasi * 100}% variasi
          skor digital  jauh lebih tinggi dari model struktural. Ini bukan temuan sebab-akibat baru,
          melainkan indikasi bahwa skor tersebut dihitung dari variabel-variabel ini sendiri.
        </InsightCallout>
      </section>

      <section className="mb-12">
        <p className="eyebrow mb-3">6.3 Kesenjangan Regional</p>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {regionGap.map((r: any) => (
            <div key={r.kawasan} className="bg-paper-card border border-line rounded-lg p-5">
              <p className="font-mono text-xs text-ink-soft mb-2">{r.kawasan.replace("_", "-")}</p>
              <p className="font-display text-2xl font-semibold text-ink">
                {r.skor_kematangan_digital}
                <span className="text-sm text-ink-soft font-body ml-1">skor digital</span>
              </p>
              <p className="font-mono text-sm text-coral mt-1">
                {r.rata_rata_waktu_respons_rujukan_menit} menit respons rujukan
              </p>
            </div>
          ))}
        </div>
        <InsightCallout tone="coral">
          Rumah sakit di Indonesia Timur tertinggal {Math.abs(headline.pilar1.gap_digital_timur_barat)}{" "}
          poin skor digital dan {headline.pilar1.gap_respons_timur_barat} menit lebih lambat merespons
          rujukan dibanding kawasan Barat-Tengah  kesenjangan ini signifikan secara statistik pada
          kedua indikator sekaligus.
        </InsightCallout>
      </section>

      <section className="mb-8">
        <p className="eyebrow mb-3">6.4 SatuSehat: Kepatuhan, Bukan Efisiensi</p>
        <p className="font-body text-ink-soft leading-relaxed max-w-2xl mb-4">
          Selisih waktu respons rujukan antara RS yang terhubung SatuSehat dan yang belum hanya{" "}
          {headline.pilar1.satusehat_selisih_menit} menit, dengan p-value {headline.pilar1.satusehat_p_value}{" "}
           jauh dari signifikan.
        </p>
        <InsightCallout tone="amber">
          Status koneksi SatuSehat sebaiknya dibaca sebagai penanda kepatuhan administratif, bukan
          bukti transformasi digital yang sudah berdampak pada layanan pasien.
        </InsightCallout>
      </section>

      <section>
        <p className="eyebrow mb-3">Diagnostik Multikolinearitas (VIF)</p>
        <DataTable
          columns={["Fitur", "VIF"]}
          rows={vifStructural
            .filter((v: any) => v.feature !== "const")
            .map((v: any) => [v.feature, v.VIF.toFixed(2)])}
          caption={`VIF maksimum ${maxVif.toFixed(2)}  di bawah ambang 10, tidak ada multikolinearitas mengganggu`}
        />
      </section>
    </div>
  );
}
