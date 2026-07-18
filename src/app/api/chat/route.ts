import { NextRequest, NextResponse } from "next/server";
import embeddingsData from "../../../../rag_corpus/embeddings.json";

type EmbeddedDoc = {
  id: string;
  title: string;
  content: string;
  metadata: { category: string; pilar: string };
  embedding: number[];
};

const EMBEDDING_MODEL = "gemini-embedding-001";
const GENERATION_MODEL = "gemini-2.5-flash-lite";

const SYSTEM_PROMPT = `Kamu adalah asisten analitik DigiCare Intelligence untuk Konsorsium Smart Hospital Nusantara.
Jawab HANYA berdasarkan potongan dokumen insight yang diberikan di bawah ini, yang merupakan hasil
analisis nyata dari 276 rumah sakit Indonesia (Pilar 1: Audit Kematangan Digital, Pilar 2: Dampak
Operasional, Pilar 3: Segmentasi & Bottleneck, Pilar 4: Prediksi Risiko, Pilar 5: Benchmark Model).

Aturan:
- Jawab dalam Bahasa Indonesia, singkat, jelas, dan langsung ke inti.
- Jangan mengarang angka atau temuan yang tidak ada di dokumen konteks.
- Jika dokumen konteks tidak cukup untuk menjawab, katakan dengan jujur bahwa informasi tersebut
  belum tercakup dalam analisis, jangan mengarang jawaban.
- Sebutkan pilar mana yang menjadi sumber jawabanmu jika relevan.`;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embedQuery(apiKey: string, text: string): Promise<number[]> {
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
    throw new Error(`Gagal embed pertanyaan (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.embedding.values;
}

function retrieveTopDocs(queryEmbedding: number[], topK = 5): EmbeddedDoc[] {
  const docs = embeddingsData as EmbeddedDoc[];
  const scored = docs.map((doc) => ({
    doc,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => s.doc);
}

async function generateAnswer(apiKey: string, question: string, contextDocs: EmbeddedDoc[]): Promise<string> {
  const contextText = contextDocs
    .map((d) => `[Sumber: ${d.metadata.pilar} - ${d.title}]\n${d.content}`)
    .join("\n\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GENERATION_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: "user",
          parts: [{ text: `KONTEKS DOKUMEN:\n${contextText}\n\nPERTANYAAN PENGGUNA:\n${question}` }],
        },
      ],
      generationConfig: { temperature: 0.3, maxOutputTokens: 700 },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gagal generate jawaban (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum dikonfigurasi di server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const question = (body?.question ?? "").trim();
    if (!question) {
      return NextResponse.json({ error: "Pertanyaan tidak boleh kosong." }, { status: 400 });
    }

    const queryEmbedding = await embedQuery(apiKey, question);
    const topDocs = retrieveTopDocs(queryEmbedding, 5);
    const answer = await generateAnswer(apiKey, question, topDocs);

    const seen = new Set<string>();
    const sources = topDocs
      .map((d) => ({ title: d.title, pilar: d.metadata.pilar }))
      .filter((s) => {
        const key = `${s.pilar}-${s.title}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return NextResponse.json({ answer, sources });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? "Terjadi kesalahan tak terduga." }, { status: 500 });
  }
}
