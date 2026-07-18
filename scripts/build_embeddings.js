/**
 * Script ini membangun file embeddings.json dari seluruh dokumen RAG (Pilar 1-5).
 * Jalankan SEKALI secara lokal sebelum deploy pertama kali, dan setiap kali isi
 * rag_corpus/master_corpus.json berubah.
 *
 * Tidak butuh Python, tidak butuh chromadb, tidak butuh Hugging Face.
 * Hanya butuh Node.js (bawaan di komputer manapun) dan satu API key: GEMINI_API_KEY.
 *
 * Cara pakai:
 *   node scripts/build_embeddings.js
 *
 * (pastikan sudah menjalankan `cp .env.example .env.local` dan mengisi GEMINI_API_KEY,
 *  atau set langsung sebagai environment variable sebelum menjalankan script ini)
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CORPUS_PATH = path.join(ROOT, "rag_corpus", "master_corpus.json");
const OUTPUT_PATH = path.join(ROOT, "rag_corpus", "embeddings.json");
const EMBEDDING_MODEL = "gemini-embedding-001";

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function embedText(apiKey, text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini embedding API gagal (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.embedding.values;
}

async function main() {
  loadEnvLocal();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY belum diset. Isi dulu di .env.local atau sebagai environment variable.");
    process.exit(1);
  }

  console.log("Memuat korpus dari:", CORPUS_PATH);
  const corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, "utf-8"));
  console.log("Jumlah dokumen:", corpus.length);

  const results = [];
  for (let i = 0; i < corpus.length; i++) {
    const doc = corpus[i];
    const text = `${doc.title}. ${doc.content}`;
    process.stdout.write(`Meng-embed dokumen ${i + 1}/${corpus.length}: ${doc.id}...`);
    try {
      const embedding = await embedText(apiKey, text);
      results.push({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        metadata: doc.metadata,
        embedding,
      });
      console.log(" OK");
    } catch (err) {
      console.log(" GAGAL");
      console.error(err.message);
      process.exit(1);
    }
    // jeda kecil supaya tidak kena rate limit
    await new Promise((r) => setTimeout(r, 150));
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  console.log();
  console.log("Selesai. Total dokumen ter-embed:", results.length);
  console.log("Tersimpan di:", OUTPUT_PATH);
  console.log("File ini siap di-commit ke git dan di-deploy ke Vercel.");
}

main();
