"""
Vercel Python Serverless Function: /api/chat

Alur RAG:
1. Terima pertanyaan pengguna dari frontend Next.js.
2. Embed pertanyaan memakai model sentence-transformers/all-MiniLM-L6-v2
   lewat Hugging Face Inference API.
3. Query koleksi ChromaDB (chroma_store/) untuk mengambil dokumen insight
   paling relevan.
4. Kirim konteks + pertanyaan ke Gemini 2.5 Flash Lite untuk menghasilkan
   jawaban akhir dalam Bahasa Indonesia.

Environment variables yang dibutuhkan:
  HUGGINGFACE_API_TOKEN
  GEMINI_API_KEY

PENTING - kenapa file ini beda dari versi sebelumnya:
Semua import yang berisiko gagal (chromadb, pysqlite3) sengaja DIPINDAH ke
dalam do_POST() dan dibungkus try/except, bukan di level atas file. Kalau
import ada di level atas dan gagal, SELURUH modul gagal dimuat sebelum
try/except manapun sempat jalan -> Vercel kasih generic 500 page tanpa
detail apapun. Dengan import di dalam fungsi, error apapun (termasuk error
import) pasti tertangkap dan dikirim balik sebagai JSON yang jelas.
"""

import json
import os
import traceback
from http.server import BaseHTTPRequestHandler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_STORE_PATH = os.path.join(ROOT, "chroma_store")
TMP_STORE_PATH = "/tmp/chroma_store"
COLLECTION_NAME = "digicare_rag"

HF_API_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
GEMINI_API_URL = (
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
    """Import chromadb dengan aman, swap ke pysqlite3 dulu kalau tersedia.
    Kalau gagal di titik manapun, exception akan naik ke pemanggil dan
    tertangkap oleh try/except utama di do_POST -> jadi respons JSON, bukan
    crash silent."""
    try:
        __import__("pysqlite3")
        import sys as _sys
        _sys.modules["sqlite3"] = _sys.modules.pop("pysqlite3")
    except ImportError:
        pass  # fallback ke sqlite3 bawaan sistem kalau pysqlite3 tidak ada

    import chromadb
    return chromadb


def ensure_store_in_tmp() -> str:
    """Copy chroma_store ke /tmp (satu-satunya folder writable di Vercel
    serverless) sekali per cold start."""
    import shutil

    if not os.path.isdir(TMP_STORE_PATH):
        if not os.path.isdir(SOURCE_STORE_PATH):
            raise RuntimeError(
                f"Folder chroma_store TIDAK DITEMUKAN di deployment ({SOURCE_STORE_PATH}). "
                "Kemungkinan besar 'includeFiles' di vercel.json belum benar, atau folder "
                "chroma_store belum ter-commit ke git."
            )
        shutil.copytree(SOURCE_STORE_PATH, TMP_STORE_PATH)
    return TMP_STORE_PATH


def embed_query(text: str) -> list:
    import requests

    token = os.environ.get("HUGGINGFACE_API_TOKEN")
    if not token:
        raise RuntimeError("HUGGINGFACE_API_TOKEN belum diset di Environment Variables Vercel.")

    response = requests.post(
        HF_API_URL,
        headers={"Authorization": f"Bearer {token}"},
        json={"inputs": text, "options": {"wait_for_model": True}},
        timeout=25,
    )
    if response.status_code != 200:
        raise RuntimeError(
            f"Hugging Face API error {response.status_code}: {response.text[:300]}"
        )
    result = response.json()

    if isinstance(result, dict) and "error" in result:
        raise RuntimeError(f"Hugging Face API error: {result['error']}")

    if isinstance(result[0], list):
        vec_len = len(result[0])
        pooled = [sum(token_vec[i] for token_vec in result) / len(result) for i in range(vec_len)]
        return pooled
    return result


def query_chroma(query_embedding: list, top_k: int = 5):
    chromadb = get_chromadb_module()
    store_path = ensure_store_in_tmp()

    client = chromadb.PersistentClient(path=store_path)
    collection = client.get_collection(COLLECTION_NAME)
    results = collection.query(query_embeddings=[query_embedding], n_results=top_k)

    docs = results["documents"][0]
    metadatas = results["metadatas"][0]
    return list(zip(docs, metadatas))


def call_gemini(question: str, context_blocks: list) -> str:
    import requests

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY belum diset di Environment Variables Vercel.")

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
        f"{GEMINI_API_URL}?key={api_key}",
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=25,
    )
    if response.status_code != 200:
        raise RuntimeError(f"Gemini API error {response.status_code}: {response.text[:300]}")
    data = response.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        raise RuntimeError(f"Format respons Gemini tidak terduga: {json.dumps(data)[:300]}")


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Try/except ini membungkus SEMUANYA, termasuk import lazy di atas,
        # jadi tidak ada lagi kemungkinan crash silent tanpa pesan error.
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length) if content_length else b"{}"
            body = json.loads(raw_body or b"{}")
            question = (body.get("question") or "").strip()

            if not question:
                self._send(400, {"error": "Pertanyaan tidak boleh kosong."})
                return

            query_embedding = embed_query(question)
            retrieved = query_chroma(query_embedding, top_k=5)
            answer = call_gemini(question, retrieved)

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
