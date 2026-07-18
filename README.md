# DigiCare Intelligence  Web Dashboard

Dashboard analitik dan asisten RAG untuk studi kasus Smart Hospital Nusantara (Kompetisi Data
Analyst 2026), merangkum 5 pilar analisis atas 276 rumah sakit di 35 provinsi Indonesia.

Stack: **Next.js 14 (App Router) + TypeScript + Tailwind CSS** untuk dashboard, dan
**ChromaDB + all-MiniLM-L6-v2 (via Hugging Face Inference API) + Gemini 2.5 Flash Lite** untuk
asisten RAG, dideploy sebagai Vercel Python Serverless Function.

## 1. Struktur Proyek

```
digicare-web/
├── src/
│   ├── app/                 halaman (Ringkasan, Pilar 1-5, Chat)
│   ├── components/          komponen UI dan chart (Recharts)
│   └── data/                data hasil analisis (JSON), dipakai langsung oleh halaman
├── public/data/              salinan data JSON yang sama (untuk referensi/fetch statis)
├── api/
│   ├── chat.py               endpoint RAG (Vercel Python Function)
│   └── requirements.txt      dependency Python untuk fungsi ini (ringan, tanpa torch)
├── scripts/
│   ├── build_vector_store.py     build embedding + index Chroma (jalankan LOKAL sekali)
│   └── requirements-build.txt    dependency untuk build script (chromadb + sentence-transformers)
├── rag_corpus/
│   └── master_corpus.json    40 dokumen insight Pilar 1-5, sumber untuk RAG
├── chroma_store/              hasil build embedding, di-commit ke git (lihat langkah 3)
└── vercel.json
```

## 2. Menjalankan di VSCode (Development)

```bash
# 1. install dependency frontend
npm install

# 2. copy env contoh, isi API key
cp .env.example .env.local
# lalu edit .env.local, isi HUGGINGFACE_API_TOKEN dan GEMINI_API_KEY

# 3. jalankan dev server
npm run dev
```

Buka http://localhost:3000. Dashboard (Ringkasan, Pilar 1-5) akan langsung berjalan karena semua
datanya sudah berupa file JSON statis di `src/data/`.

Untuk halaman **Chat** (`/chat`), endpoint `/api/chat` adalah Python function  `next dev` TIDAK
menjalankan fungsi Python secara otomatis. Untuk mencobanya secara lokal:

```bash
npm install -g vercel
vercel dev
```

`vercel dev` menjalankan Next.js dan fungsi Python `/api/chat.py` bersamaan, meniru environment
production Vercel.

## 3. WAJIB: Build Vector Store Sebelum Deploy Pertama Kali

Fungsi `/api/chat.py` di Vercel membaca index Chroma yang sudah jadi dari folder `chroma_store/`
 ia **tidak** menghitung embedding saat runtime (supaya function tetap ringan dan cepat). Karena
itu, langkah ini wajib dijalankan secara lokal sebelum deploy pertama, dan setiap kali isi
`rag_corpus/master_corpus.json` berubah:

```bash
pip install -r scripts/requirements-build.txt
python scripts/build_vector_store.py
```

Script ini akan:
1. Memuat model `sentence-transformers/all-MiniLM-L6-v2` (didownload otomatis, butuh internet)
2. Meng-embed seluruh 40 dokumen di `rag_corpus/master_corpus.json`
3. Menyimpan index ke folder `chroma_store/`

Setelah selesai, **commit folder `chroma_store/` ke git**  folder ini yang akan ikut ter-deploy
ke Vercel dan dibaca langsung (read-only) oleh `api/chat.py`.

> Catatan: model embedding hanya jalan di mesin lokal Anda saat build. Di runtime Vercel,
> pertanyaan pengguna di-embed lewat Hugging Face Inference API (model yang sama,
> `all-MiniLM-L6-v2`), supaya fungsi serverless tidak perlu memuat PyTorch yang berat.

## 4. Deploy ke Vercel

```bash
npm install -g vercel
vercel login
vercel
```

Saat deploy, isi Environment Variables di dashboard Vercel (Project Settings → Environment
Variables), sesuai `.env.example`:

| Variable | Keterangan |
|---|---|
| `HUGGINGFACE_API_TOKEN` | Token dari https://huggingface.co/settings/tokens (akses gratis) |
| `GEMINI_API_KEY` | API key dari https://aistudio.google.com/app/apikey |

Pastikan `chroma_store/` sudah ter-commit sebelum push, karena Vercel men-deploy persis isi git
repo Anda.

## 5. Memperbarui Data Analisis

Jika hasil analisis Pilar 1-5 berubah:
1. Perbarui file JSON terkait di `src/data/` (dan `public/data/` bila dipakai fetch statis)
2. Jika insight naratif untuk RAG juga berubah, perbarui `rag_corpus/master_corpus.json`
3. Jalankan ulang `python scripts/build_vector_store.py`
4. Commit ulang `chroma_store/` dan redeploy

## 6. Kenapa Arsitektur RAG-nya Begini?

Chroma dalam mode embedded (Python, `PersistentClient`) tidak bisa dijadikan server yang selalu
menyala di lingkungan serverless seperti Vercel. Solusinya: index Chroma dibangun sekali secara
lokal lalu di-bundle bersama deployment sebagai file statis read-only  setiap request hanya
membaca index tersebut, tidak menulis. Model embedding `all-MiniLM-L6-v2` juga sengaja dipanggil
lewat Hugging Face Inference API (bukan dimuat langsung di function), karena PyTorch + model
sentence-transformers terlalu besar untuk ukuran bundel function Vercel yang wajar.
