import SectionHeader from "@/components/SectionHeader";
import StatCard from "@/components/StatCard";
import InsightCallout from "@/components/InsightCallout";
import DataTable from "@/components/DataTable";
import HorizontalBarChart from "@/components/charts/HorizontalBarChart";
import structural from "@/data/pilar1_coefficients_structural.json";
import investment from "@/data/pilar1_coefficients_investment.json";
import vifStructural from "@/data/pilar1_vif_structural.json";
import vifInvestment from "@/data/pilar1_vif_investment.json";
import regionGap from "@/data/pilar1_region_gap.json";
import headline from "@/data/headline_stats.json";

export default function Pilar1Page() {
  const maxVif = Math.max(
    ...vifStructural.filter((v: any) => v.feature !== "const").map((v: any) => v.VIF)
  );

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
          label="Gap Jawa vs Maluku & Papua"
          value={String(headline.pilar1.gap_skor_jawa_vs_maluku_papua)}
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
          rata-rata 28.08 poin lebih tinggi dibanding kategori acuan (Bali & Nusa Tenggara), sementara
          Kelas D tertinggal 13.04 poin. Kesenjangan digital rumah sakit Indonesia lebih banyak
          dijelaskan oleh <em>di mana dan kelas apa</em> sebuah rumah sakit berada, dibanding
          keputusan manajemen jangka pendek.
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
        <p className="font-body text-ink-soft mb-4 leading-relaxed max-w-2xl">
          Skor kematangan digital dan waktu respons rujukan dipecah per region secara granular
          (bukan sekadar Barat vs Timur), sehingga kesenjangan antar wilayah spesifik Indonesia
          Timur juga bisa dibedakan satu sama lain.
        </p>
        <DataTable
          columns={["Region", "Skor Digital", "Waktu Respons (menit)"]}
          rows={regionGap
            .slice()
            .sort((a: any, b: any) => b.skor_kematangan_digital - a.skor_kematangan_digital)
            .map((r: any) => [r.region, r.skor_kematangan_digital, r.rata_rata_waktu_respons_rujukan_menit])}
        />
        <InsightCallout tone="coral">
          Region Jawa memiliki skor digital tertinggi ({headline.pilar1.skor_region_tertinggi}) dan
          waktu respons tercepat, sedangkan Maluku & Papua berada di posisi terendah (
          {headline.pilar1.skor_region_terendah} poin skor digital, {55.78} menit waktu respons) 
          selisih {headline.pilar1.gap_skor_jawa_vs_maluku_papua} poin skor digital dan{" "}
          {headline.pilar1.gap_respons_jawa_vs_maluku_papua} menit waktu respons antara kedua
          ujung spektrum ini.
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
        <div className="grid md:grid-cols-2 gap-4">
          <DataTable
            columns={["Fitur (Model Struktural)", "VIF"]}
            rows={vifStructural
              .filter((v: any) => v.feature !== "const")
              .map((v: any) => [v.feature, v.VIF.toFixed(2)])}
            caption={`VIF maksimum ${maxVif.toFixed(2)}  di bawah ambang 10`}
          />
          <DataTable
            columns={["Fitur (Model Investasi)", "VIF"]}
            rows={vifInvestment
              .filter((v: any) => v.feature !== "const")
              .map((v: any) => [v.feature, v.VIF.toFixed(2)])}
            caption="Seluruh VIF di bawah 3  tidak ada multikolinearitas"
          />
        </div>
      </section>
    </div>
  );
}
