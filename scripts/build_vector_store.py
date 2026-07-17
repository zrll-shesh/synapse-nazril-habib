"""
Script ini membangun vector store Chroma dari seluruh dokumen RAG (Pilar 1-5).
Jalankan SEKALI secara lokal di VSCode sebelum deploy pertama kali, dan setiap
kali isi rag_corpus/master_corpus.json berubah.

Model embedding (all-MiniLM-L6-v2) hanya dijalankan di sini, di mesin lokal,
TIDAK di runtime Vercel, supaya fungsi serverless tetap ringan.

Cara pakai:
    pip install -r scripts/requirements-build.txt
    python scripts/build_vector_store.py
"""

import json
import os
import shutil

import chromadb
from sentence_transformers import SentenceTransformer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS_PATH = os.path.join(ROOT, "rag_corpus", "master_corpus.json")
STORE_PATH = os.path.join(ROOT, "chroma_store")
COLLECTION_NAME = "digicare_rag"
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def main():
    print("Memuat korpus dari:", CORPUS_PATH)
    with open(CORPUS_PATH, "r", encoding="utf-8") as f:
        corpus = json.load(f)
    print("Jumlah dokumen:", len(corpus))

    print("Memuat model embedding:", MODEL_NAME)
    model = SentenceTransformer(MODEL_NAME)

    texts = [f"{doc['title']}. {doc['content']}" for doc in corpus]
    print("Menghitung embedding untuk seluruh dokumen...")
    embeddings = model.encode(texts, show_progress_bar=True, normalize_embeddings=True)

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
        embeddings=[emb.tolist() for emb in embeddings],
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
