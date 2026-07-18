# DigiCare Intelligence  Web Dashboard

Dashboard analitik dan asisten RAG untuk studi kasus Smart Hospital Nusantara (Kompetisi Data
Analyst 2026), merangkum 5 pilar analisis atas 276 rumah sakit di 35 provinsi Indonesia.

Stack: **Next.js 14 (App Router) + TypeScript + Tailwind CSS** untuk dashboard, dan **Gemini API**
(satu-satunya dependency eksternal) untuk asisten RAG  tidak ada Python, tidak ada ChromaDB,
tidak ada Hugging Face. Semua berjalan sebagai satu aplikasi Next.js biasa.

## 1. Struktur Proyek

```
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts   endpoint RAG (Next.js API Route, Node.js biasa)
│   │   ├── page.tsx             Ringkasan
│   │   ├── pilar-1..5/          halaman tiap pilar
│   │   └── chat/                halaman chat
│   ├── components/              komponen UI dan chart (Recharts)
│   └── data/                    data hasil analisis (JSON), dipakai langsung oleh halaman
├── public/data/                  salinan data JSON yang sama
├── scripts/
│   └── build_embeddings.js      generate embedding dokumen RAG (Node.js, jalankan sekali)
└── rag_corpus/
    ├── master_corpus.json       40 dokumen insight Pilar 1-5, sumber untuk RAG
    └── embeddings.json          hasil embedding (dibuat oleh build_embeddings.js)
```

## 2. Menjalankan di VSCode (Development)

Butuh Node.js versi 18 ke atas (cek dengan `node -v`).

```bash
# 1. install dependency
npm install

# 2. copy env contoh, isi API key
cp .env.example .env.local
```

Buka `.env.local`, isi `GEMINI_API_KEY`  ambil dari https://aistudio.google.com/app/apikey
(gratis, tinggal login pakai akun Google). Ini **satu-satunya** API key yang dibutuhkan seluruh
proyek ini.

```bash
# 3. build embedding dokumen RAG (WAJIB, sekali saja)
npm run build:embeddings

# 4. jalankan dev server
npm run dev
```

Buka http://localhost:3000. Semua halaman termasuk **Chat** langsung jalan penuh di `npm run dev`
biasa  tidak perlu tool tambahan seperti `vercel dev`, karena semuanya Next.js standar.

## 3. Kenapa Harus `npm run build:embeddings` Dulu?

Fitur chat butuh mencari dokumen insight mana yang paling relevan dengan pertanyaan pengguna.
Proses ini butuh representasi angka (embedding) dari setiap dokumen. Alih-alih menghitungnya
setiap kali ada pertanyaan (lambat dan boros), embedding dihitung SEKALI di awal dan disimpan ke
`rag_corpus/embeddings.json`. Saat pengguna bertanya, sistem tinggal membandingkan pertanyaan
dengan embedding yang sudah tersimpan itu (perhitungan cosine similarity biasa, sangat cepat).

Jalankan ulang `npm run build:embeddings` setiap kali isi `rag_corpus/master_corpus.json` berubah.

## 4. Deploy ke Vercel

```bash
git add -A
git commit -m "Deploy DigiCare Intelligence"
git push
```

Lalu di dashboard Vercel:
1. Import project dari GitHub (kalau belum pernah)
2. Buka **Project Settings → Environment Variables**
3. Tambahkan satu variable: Key `GEMINI_API_KEY`, Value sama seperti di `.env.local`
4. Redeploy

Tidak ada konfigurasi runtime khusus, tidak ada `vercel.json`, tidak ada dependency Python.
Vercel otomatis mendeteksi ini sebagai project Next.js standar dan men-deploy `api/chat/route.ts`
sebagai Node.js Function biasa.

**Penting:** pastikan `rag_corpus/embeddings.json` hasil dari langkah 2 sudah ter-commit ke git
(bukan cuma ada di laptop kamu)  cek dengan `git status`, harus muncul sebagai file yang berubah/
baru sebelum kamu commit. Tanpa file ini ter-push, fitur chat di production akan mengembalikan
hasil kosong.

## 5. Memperbarui Data Analisis

Jika hasil analisis Pilar 1-5 berubah:
1. Perbarui file JSON terkait di `src/data/` (dan `public/data/` bila dipakai)
2. Jika insight naratif untuk RAG juga berubah, perbarui `rag_corpus/master_corpus.json`
3. Jalankan ulang `npm run build:embeddings`
4. Commit ulang `rag_corpus/embeddings.json` dan redeploy
