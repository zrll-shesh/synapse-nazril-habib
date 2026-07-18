"""
Vercel Python Serverless Function: /api/chat

Alur RAG (full Gemini, tanpa Hugging Face):
1. Terima pertanyaan pengguna dari frontend Next.js.
2. Embed pertanyaan memakai Gemini Embedding API (models/gemini-embedding-001).
3. Query koleksi ChromaDB (chroma_store/) untuk mengambil dokumen insight
   paling relevan. PENTING: chroma_store harus dibangun memakai
   scripts/build_vector_store.py versi Gemini (model + outputDimensionality
   HARUS SAMA PERSIS dengan yang dipakai di sini), supaya dimensi vektor
   query dan index cocok.
4. Kirim konteks + pertanyaan ke Gemini 2.5 Flash Lite untuk menghasilkan
   jawaban akhir dalam Bahasa Indonesia.

Environment variables yang dibutuhkan:
  GEMINI_API_KEY   (dipakai untuk embedding DAN generation)
"""

import json
import os
import traceback
from http.server import BaseHTTPRequestHandler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_STORE_PATH = os.path.join(ROOT, "chroma_store")
TMP_STORE_PATH = "/tmp/chroma_store"
COLLECTION_NAME = "digicare_rag"

EMBED_MODEL = "models/gemini-embedding-001"
EMBED_URL = f"https://generativelanguage.googleapis.com/v1beta/{EMBED_MODEL}:embedContent"
OUTPUT_DIM = 768  # HARUS SAMA dengan scripts/build_vector_store.py

GEMINI_GENERATE_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash-lite:generateContent"
)

SYSTEM_PROMPT = """Kamu adalah asisten analitik DigiCare Intelligence untuk Konsorsium Smart Hospital Nusantara.
Jawab HANYA berdasarkan potongan dokumen insight yang diberikan di bawah ini, yang merupakan hasil
analisis nyata dari 276 rumah sakit Indonesia (Pilar 1: Audit Kematangan Digital, Pilar 2: Dampak
Operasional, Pilar 3: Segmentasi & Bottleneck, Pilar 4: Prediksi Risiko, Pilar 5: Benchmark Model).

Aturan:
- Jawab dalam Bahasa Indonesia, singkat, jelas, dan langsung ke inti.
- Jangan mengarang angka atau temuan yang tidak ada di dokumen konteks.
- Jika dokumen konteks tidak cukup untuk menjawab, katakan dengan jujur bahwa informasi tersebut
  belum tercakup dalam analisis, jangan mengarang jawaban.
- Sebutkan pilar mana yang menjadi sumber jawabanmu jika relevan.
"""


def get_chromadb_module():
    try:
        __import__("pysqlite3")
        import sys as _sys
        _sys.modules["sqlite3"] = _sys.modules.pop("pysqlite3")
    except ImportError:
        pass

    import chromadb
    return chromadb


def ensure_store_in_tmp() -> str:
    import shutil

    if not os.path.isdir(TMP_STORE_PATH):
        if not os.path.isdir(SOURCE_STORE_PATH):
            raise RuntimeError(
                f"Folder chroma_store TIDAK DITEMUKAN di deployment ({SOURCE_STORE_PATH}). "
                "Cek 'includeFiles' di vercel.json dan pastikan chroma_store ter-commit ke git."
            )
        shutil.copytree(SOURCE_STORE_PATH, TMP_STORE_PATH)
    return TMP_STORE_PATH


def embed_query(text: str, api_key: str) -> list:
    import requests

    response = requests.post(
        f"{EMBED_URL}?key={api_key}",
        headers={"Content-Type": "application/json"},
        json={
            "model": EMBED_MODEL,
            "content": {"parts": [{"text": text}]},
            "taskType": "RETRIEVAL_QUERY",
            "outputDimensionality": OUTPUT_DIM,
        },
        timeout=20,
    )
    if response.status_code != 200:
        raise RuntimeError(f"Gemini Embedding API error {response.status_code}: {response.text[:300]}")
    data = response.json()
    try:
        return data["embedding"]["values"]
    except KeyError:
        raise RuntimeError(f"Format respons embedding tidak terduga: {json.dumps(data)[:300]}")


def query_chroma(query_embedding: list, top_k: int = 5):
    chromadb = get_chromadb_module()
    store_path = ensure_store_in_tmp()

    client = chromadb.PersistentClient(path=store_path)
    collection = client.get_collection(COLLECTION_NAME)
    results = collection.query(query_embeddings=[query_embedding], n_results=top_k)

    docs = results["documents"][0]
    metadatas = results["metadatas"][0]
    return list(zip(docs, metadatas))


def call_gemini(question: str, context_blocks: list, api_key: str) -> str:
    import requests

    context_text = "\n\n".join(
        f"[Sumber: {meta['pilar']} - {meta['title']}]\n{doc}" for doc, meta in context_blocks
    )

    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": f"KONTEKS DOKUMEN:\n{context_text}\n\nPERTANYAAN PENGGUNA:\n{question}"}
                ],
            }
        ],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 700},
    }

    response = requests.post(
        f"{GEMINI_GENERATE_URL}?key={api_key}",
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=25,
    )
    if response.status_code != 200:
        raise RuntimeError(f"Gemini Generate API error {response.status_code}: {response.text[:300]}")
    data = response.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise RuntimeError(f"Format respons Gemini tidak terduga: {json.dumps(data)[:300]}")


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                self._send(500, {"error": "GEMINI_API_KEY belum diset di Environment Variables Vercel."})
                return

            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length) if content_length else b"{}"
            body = json.loads(raw_body or b"{}")
            question = (body.get("question") or "").strip()

            if not question:
                self._send(400, {"error": "Pertanyaan tidak boleh kosong."})
                return

            query_embedding = embed_query(question, api_key)
            retrieved = query_chroma(query_embedding, top_k=5)
            answer = call_gemini(question, retrieved, api_key)

            sources = [{"title": meta["title"], "pilar": meta["pilar"]} for _, meta in retrieved]
            seen = set()
            unique_sources = []
            for s in sources:
                key = (s["title"], s["pilar"])
                if key not in seen:
                    seen.add(key)
                    unique_sources.append(s)

            self._send(200, {"answer": answer, "sources": unique_sources})
        except Exception as e:
            traceback.print_exc()
            self._send(500, {
                "error": str(e),
                "error_type": type(e).__name__,
            })

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _send(self, status: int, payload: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))
