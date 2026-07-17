"use client";

import { useRef, useState } from "react";
import SectionHeader from "@/components/SectionHeader";

type Source = { title: string; pilar: string };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[] };

const SUGGESTIONS = [
  "Apakah SatuSehat benar-benar mempercepat layanan rumah sakit?",
  "Rumah sakit mana yang paling berisiko mengalami inefisiensi ganda?",
  "Kenapa XGBoost tetap dipilih walau tidak lebih akurat dari MLP?",
  "Apa hubungan skor kematangan digital dengan lama rawat inap?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Halo, saya asisten DigiCare Intelligence. Tanyakan apa saja tentang temuan lima pilar analisis  jawaban saya didasarkan pada dokumen insight asli, bukan tebakan.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      if (!res.ok) throw new Error(`Request gagal (${res.status})`);
      const data = await res.json();
      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (err: any) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "Maaf, terjadi kendala menghubungi asisten RAG. Pastikan API key dan chroma_store sudah dikonfigurasi dengan benar (lihat README).",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <SectionHeader
        eyebrow="RAG Assistant"
        title="Tanya DigiCare"
        description="Dijawab berbasis ChromaDB + embedding all-MiniLM-L6-v2 atas dokumen insight Pilar 1-5, digenerasi oleh Gemini 2.5 Flash Lite."
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                m.role === "user"
                  ? "bg-teal text-paper-card"
                  : "bg-paper-card border border-line text-ink"
              }`}
            >
              <p className="font-body text-[0.95rem] leading-relaxed whitespace-pre-wrap">{m.content}</p>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-2 border-t border-line/50 flex flex-wrap gap-1.5">
                  {m.sources.map((s, j) => (
                    <span
                      key={j}
                      className="font-mono text-[0.65rem] px-2 py-0.5 rounded bg-teal-soft text-teal-deep"
                    >
                      {s.pilar} &middot; {s.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-paper-card border border-line rounded-lg px-4 py-3">
              <p className="font-mono text-xs text-ink-soft animate-pulse">Mencari dokumen relevan...</p>
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="focus-ring font-body text-xs px-3 py-2 rounded-full border border-line bg-paper-card hover:border-teal text-ink-soft"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tulis pertanyaan tentang temuan Pilar 1-5..."
          className="focus-ring flex-1 font-body text-sm px-4 py-3 rounded-lg border border-line bg-paper-card"
        />
        <button
          type="submit"
          disabled={loading}
          className="focus-ring font-mono text-xs px-5 py-3 rounded-lg bg-teal text-paper-card disabled:opacity-50"
        >
          KIRIM
        </button>
      </form>
    </div>
  );
}
