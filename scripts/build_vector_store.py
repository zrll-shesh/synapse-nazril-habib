"""
Script ini membangun ULANG vector store Chroma dari seluruh dokumen RAG
(Pilar 1-5), memakai Gemini Embedding API (model gemini-embedding-001).
Ini supaya embedding yang dipakai untuk membangun index SAMA PERSIS dengan
embedding yang dipakai saat query di /api/chat.

Jalankan SEKALI secara lokal setiap kali isi rag_corpus/master_corpus.json
berubah, atau untuk migrasi/rebuild index.

Cara pakai:
    pip install chromadb requests python-dotenv
    # pastikan GEMINI_API_KEY ada di environment, contoh via PowerShell:
    #   $env:GEMINI_API_KEY="xxxxx"
    python scripts/build_vector_store.py
"""

import json
import os
import shutil
import time

import chromadb
import requests

try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv(".env.local")
except ImportError:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS_PATH = os.path.join(ROOT, "rag_corpus", "master_corpus.json")
STORE_PATH = os.path.join(ROOT, "chroma_store")
COLLECTION_NAME = "digicare_rag"

EMBED_MODEL = "models/gemini-embedding-001"
EMBED_URL = f"https://generativelanguage.googleapis.com/v1beta/{EMBED_MODEL}:embedContent"
OUTPUT_DIM = 768


def embed_text(text: str, api_key: str, task_type: str = "RETRIEVAL_DOCUMENT") -> list:
    """Panggil Gemini Embedding API untuk satu teks. Dipakai baik saat build
    index (di sini, task_type=RETRIEVAL_DOCUMENT) maupun saat query di
    api/chat.py (task_type=RETRIEVAL_QUERY)."""
    response = requests.post(
        f"{EMBED_URL}?key={api_key}",
        headers={"Content-Type": "application/json"},
        json={
            "model": EMBED_MODEL,
            "content": {"parts": [{"text": text}]},
            "taskType": task_type,
            "outputDimensionality": OUTPUT_DIM,
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["embedding"]["values"]


def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY tidak ditemukan di environment variable. "
            "Set dulu, contoh di PowerShell:\n"
            '  $env:GEMINI_API_KEY="xxxxx"'
        )

    print("Memuat korpus dari:", CORPUS_PATH)
    with open(CORPUS_PATH, "r", encoding="utf-8") as f:
        corpus = json.load(f)
    print("Jumlah dokumen:", len(corpus))

    print("Menghitung embedding lewat Gemini API (gemini-embedding-001) untuk setiap dokumen...")
    embeddings = []
    for i, doc in enumerate(corpus, 1):
        text = f"{doc['title']}. {doc['content']}"
        emb = embed_text(text, api_key, task_type="RETRIEVAL_DOCUMENT")
        embeddings.append(emb)
        print(f"  [{i}/{len(corpus)}] {doc['title'][:60]}")
        time.sleep(0.3)  # jaga-jaga rate limit

    if os.path.exists(STORE_PATH):
        print("Menghapus chroma_store lama...")
        shutil.rmtree(STORE_PATH)
    os.makedirs(STORE_PATH, exist_ok=True)

    print("Membuat koleksi Chroma baru di:", STORE_PATH)
    client = chromadb.PersistentClient(path=STORE_PATH)
    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    collection.add(
        ids=[doc["id"] for doc in corpus],
        embeddings=embeddings,
        documents=[doc["content"] for doc in corpus],
        metadatas=[
            {
                "title": doc["title"],
                "category": doc["metadata"]["category"],
                "pilar": doc["metadata"]["pilar"],
            }
            for doc in corpus
        ],
    )

    print("Selesai. Total dokumen tersimpan di koleksi:", collection.count())
    print()
    print("Folder chroma_store/ siap di-commit ke git dan di-deploy ke Vercel.")


if __name__ == "__main__":
    main()