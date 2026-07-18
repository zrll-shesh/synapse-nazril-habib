# """
# Vercel Python Serverless Function: /api/chat

# Alur RAG:
# 1. Terima pertanyaan pengguna dari frontend Next.js.
# 2. Embed pertanyaan memakai model sentence-transformers/all-MiniLM-L6-v2
#    lewat Hugging Face Inference API (bukan load model lokal, supaya fungsi
#    serverless tetap ringan dan cepat cold-start-nya).
# 3. Query koleksi ChromaDB (chroma_store/) yang sudah dibangun sebelumnya oleh
#    scripts/build_vector_store.py, untuk mengambil dokumen insight paling relevan.
# 4. Kirim konteks + pertanyaan ke Gemini 2.5 Flash Lite untuk menghasilkan
#    jawaban akhir dalam Bahasa Indonesia, membumi pada dokumen yang diambil.

# Environment variables yang dibutuhkan (lihat .env.example):
#   HUGGINGFACE_API_TOKEN
#   GEMINI_API_KEY
# """

# import json
# import os
# import traceback

# import chromadb
# import requests

# ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# STORE_PATH = os.path.join(ROOT, "chroma_store")
# COLLECTION_NAME = "digicare_rag"

# HF_API_URL = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
# GEMINI_API_URL = (
#     "https://generativelanguage.googleapis.com/v1beta/models/"
#     "gemini-2.5-flash-lite:generateContent"
# )

# SYSTEM_PROMPT = """Kamu adalah asisten analitik DigiCare Intelligence untuk Konsorsium Smart Hospital Nusantara.
# Jawab HANYA berdasarkan potongan dokumen insight yang diberikan di bawah ini, yang merupakan hasil
# analisis nyata dari 276 rumah sakit Indonesia (Pilar 1: Audit Kematangan Digital, Pilar 2: Dampak
# Operasional, Pilar 3: Segmentasi & Bottleneck, Pilar 4: Prediksi Risiko, Pilar 5: Benchmark Model).

# Aturan:
# - Jawab dalam Bahasa Indonesia, singkat, jelas, dan langsung ke inti.
# - Jangan mengarang angka atau temuan yang tidak ada di dokumen konteks.
# - Jika dokumen konteks tidak cukup untuk menjawab, katakan dengan jujur bahwa informasi tersebut
#   belum tercakup dalam analisis, jangan mengarang jawaban.
# - Sebutkan pilar mana yang menjadi sumber jawabanmu jika relevan.
# """


# def embed_query(text: str) -> list:
#     token = os.environ.get("HUGGINGFACE_API_TOKEN")
#     if not token:
#         raise RuntimeError("HUGGINGFACE_API_TOKEN belum diset di environment variables.")

#     response = requests.post(
#         HF_API_URL,
#         headers={"Authorization": f"Bearer {token}"},
#         json={"inputs": text, "options": {"wait_for_model": True}},
#         timeout=30,
#     )
#     response.raise_for_status()
#     result = response.json()

#     # HF feature-extraction can return [seq_len, hidden] or already pooled [hidden].
#     # Mean-pool over tokens if a 2D array is returned.
#     if isinstance(result[0], list):
#         vec_len = len(result[0])
#         pooled = [sum(token_vec[i] for token_vec in result) / len(result) for i in range(vec_len)]
#         return pooled
#     return result


# def query_chroma(query_embedding: list, top_k: int = 5):
#     client = chromadb.PersistentClient(path=STORE_PATH)
#     collection = client.get_collection(COLLECTION_NAME)
#     results = collection.query(query_embeddings=[query_embedding], n_results=top_k)

#     docs = results["documents"][0]
#     metadatas = results["metadatas"][0]
#     return list(zip(docs, metadatas))


# def call_gemini(question: str, context_blocks: list) -> str:
#     api_key = os.environ.get("GEMINI_API_KEY")
#     if not api_key:
#         raise RuntimeError("GEMINI_API_KEY belum diset di environment variables.")

#     context_text = "\n\n".join(
#         f"[Sumber: {meta['pilar']} - {meta['title']}]\n{doc}" for doc, meta in context_blocks
#     )

#     payload = {
#         "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
#         "contents": [
#             {
#                 "role": "user",
#                 "parts": [
#                     {
#                         "text": f"KONTEKS DOKUMEN:\n{context_text}\n\nPERTANYAAN PENGGUNA:\n{question}"
#                     }
#                 ],
#             }
#         ],
#         "generationConfig": {"temperature": 0.3, "maxOutputTokens": 700},
#     }

#     response = requests.post(
#         f"{GEMINI_API_URL}?key={api_key}",
#         headers={"Content-Type": "application/json"},
#         json=payload,
#         timeout=30,
#     )
#     response.raise_for_status()
#     data = response.json()
#     return data["candidates"][0]["content"]["parts"][0]["text"]


# def handler(request):
#     """Kept for reference / local testing outside Vercel; the actual Vercel
#     entrypoint used in production is the `handler` class below."""
#     raise NotImplementedError("Gunakan class handler (BaseHTTPRequestHandler) di bawah untuk Vercel.")


# # --- Vercel Python runtime entrypoint ---
# # Vercel's Python runtime (@vercel/python) looks for a class named `handler`
# # that extends BaseHTTPRequestHandler in this file.
# from http.server import BaseHTTPRequestHandler


# class handler(BaseHTTPRequestHandler):
#     def do_POST(self):
#         try:
#             content_length = int(self.headers.get("Content-Length", 0))
#             raw_body = self.rfile.read(content_length)
#             body = json.loads(raw_body or b"{}")
#             question = (body.get("question") or "").strip()

#             if not question:
#                 self._send(400, {"error": "Pertanyaan tidak boleh kosong."})
#                 return

#             query_embedding = embed_query(question)
#             retrieved = query_chroma(query_embedding, top_k=5)
#             answer = call_gemini(question, retrieved)

#             sources = [{"title": meta["title"], "pilar": meta["pilar"]} for _, meta in retrieved]
#             seen = set()
#             unique_sources = []
#             for s in sources:
#                 key = (s["title"], s["pilar"])
#                 if key not in seen:
#                     seen.add(key)
#                     unique_sources.append(s)

#             self._send(200, {"answer": answer, "sources": unique_sources})
#         except Exception as e:
#             traceback.print_exc()
#             self._send(500, {"error": str(e)})

#     def do_OPTIONS(self):
#         self.send_response(204)
#         self.send_header("Access-Control-Allow-Origin", "*")
#         self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
#         self.send_header("Access-Control-Allow-Headers", "Content-Type")
#         self.end_headers()

#     def _send(self, status: int, payload: dict):
#         self.send_response(status)
#         self.send_header("Content-Type", "application/json")
#         self.send_header("Access-Control-Allow-Origin", "*")
#         self.end_headers()
#         self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))

"""
Vercel Python Serverless Function: /api/chat

Alur RAG:
1. Terima pertanyaan pengguna dari frontend Next.js.
2. Embed pertanyaan memakai model sentence-transformers/all-MiniLM-L6-v2
   lewat Hugging Face Inference API (bukan load model lokal, supaya fungsi
   serverless tetap ringan dan cepat cold-start-nya).
3. Query koleksi ChromaDB (chroma_store/) yang sudah dibangun sebelumnya oleh
   scripts/build_vector_store.py, untuk mengambil dokumen insight paling relevan.
4. Kirim konteks + pertanyaan ke Gemini 2.5 Flash Lite untuk menghasilkan
   jawaban akhir dalam Bahasa Indonesia, membumi pada dokumen yang diambil.

Environment variables yang dibutuhkan (lihat .env.example):
  HUGGINGFACE_API_TOKEN
  GEMINI_API_KEY

CATATAN PERBAIKAN (lihat komentar berkode [FIX] di bawah):
1. [FIX sqlite3] Sistem Python bawaan Vercel (Amazon Linux) sering punya
   sqlite3 versi lama (<3.35.0), sedangkan chromadb butuh sqlite3 >= 3.35.0.
   Kalau ini terjadi, `import chromadb` langsung crash SEBELUM masuk ke
   try/except manapun di do_POST(), makanya traceback kita sendiri tidak
   pernah muncul di log. Fix: swap ke pysqlite3-binary sebelum import chromadb.
2. [FIX filesystem] Vercel serverless functions read-only kecuali folder
   /tmp. chromadb.PersistentClient tetap butuh menulis (lock file/WAL) walau
   cuma buat query. Fix: copy folder chroma_store ke /tmp sekali per cold
   start, baru buka PersistentClient dari /tmp.
"""

# [FIX sqlite3] HARUS di baris paling atas, sebelum import chromadb apapun.
try:
    __import__("pysqlite3")
    import sys as _sys
    _sys.modules["sqlite3"] = _sys.modules.pop("pysqlite3")
except ImportError:
    # Kalau pysqlite3-binary belum terinstall, biarkan fallback ke sqlite3
    # bawaan sistem (mungkin masih cukup baru di sebagian environment).
    pass

import json
import os
import shutil
import traceback

import chromadb
import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_STORE_PATH = os.path.join(ROOT, "chroma_store")
# [FIX filesystem] Buka PersistentClient dari /tmp, bukan langsung dari
# folder deployment yang read-only.
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


def ensure_store_in_tmp() -> str:
    """[FIX filesystem] Copy chroma_store ke /tmp sekali per cold start
    (kalau belum ada), lalu return path-nya. /tmp persisten selama instance
    function masih 'hangat', jadi copy ini tidak terjadi di setiap request."""
    if not os.path.isdir(TMP_STORE_PATH):
        if not os.path.isdir(SOURCE_STORE_PATH):
            raise RuntimeError(
                f"Folder chroma_store tidak ditemukan di deployment: {SOURCE_STORE_PATH}. "
                "Pastikan folder ini ikut ter-commit ke repo dan tidak masuk .vercelignore."
            )
        shutil.copytree(SOURCE_STORE_PATH, TMP_STORE_PATH)
    return TMP_STORE_PATH


def embed_query(text: str) -> list:
    token = os.environ.get("HUGGINGFACE_API_TOKEN")
    if not token:
        raise RuntimeError("HUGGINGFACE_API_TOKEN belum diset di environment variables.")

    response = requests.post(
        HF_API_URL,
        headers={"Authorization": f"Bearer {token}"},
        json={"inputs": text, "options": {"wait_for_model": True}},
        timeout=30,
    )
    response.raise_for_status()
    result = response.json()

    # HF feature-extraction can return [seq_len, hidden] or already pooled [hidden].
    # Mean-pool over tokens if a 2D array is returned.
    if isinstance(result[0], list):
        vec_len = len(result[0])
        pooled = [sum(token_vec[i] for token_vec in result) / len(result) for i in range(vec_len)]
        return pooled
    return result


def query_chroma(query_embedding: list, top_k: int = 5):
    store_path = ensure_store_in_tmp()
    client = chromadb.PersistentClient(path=store_path)
    collection = client.get_collection(COLLECTION_NAME)
    results = collection.query(query_embeddings=[query_embedding], n_results=top_k)

    docs = results["documents"][0]
    metadatas = results["metadatas"][0]
    return list(zip(docs, metadatas))


def call_gemini(question: str, context_blocks: list) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY belum diset di environment variables.")

    context_text = "\n\n".join(
        f"[Sumber: {meta['pilar']} - {meta['title']}]\n{doc}" for doc, meta in context_blocks
    )

    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": f"KONTEKS DOKUMEN:\n{context_text}\n\nPERTANYAAN PENGGUNA:\n{question}"
                    }
                ],
            }
        ],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 700},
    }

    response = requests.post(
        f"{GEMINI_API_URL}?key={api_key}",
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


def handler(request):
    """Kept for reference / local testing outside Vercel; the actual Vercel
    entrypoint used in production is the `handler` class below."""
    raise NotImplementedError("Gunakan class handler (BaseHTTPRequestHandler) di bawah untuk Vercel.")


# --- Vercel Python runtime entrypoint ---
# Vercel's Python runtime (@vercel/python) looks for a class named `handler`
# that extends BaseHTTPRequestHandler in this file.
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length)
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
            self._send(500, {"error": str(e)})

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
