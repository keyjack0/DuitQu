"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency, isThisMonth } from "@/lib/utils";
import { LazyAddTransactionModal } from "@/components/transactions/LazyAddTransactionModal";
import { Bot, Send, Sparkles, User, Loader2, Trash2 } from "lucide-react";
import { ParsedTransaction } from "@/types";
import { getSupabaseClient } from "@/lib/supabase";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import MarkdownText from "@/components/ai/MarkdownText";

interface Message {
  role: "user" | "assistant";
  content: string;
  parsedTransaction?: ParsedTransaction;
}

const SYSTEM_PROMPT = `Kamu adalah DuitQu AI, asisten keuangan pribadi yang cerdas dan ramah. Kamu berbicara dalam Bahasa Indonesia yang santai dan mudah dipahami.

Kemampuanmu:
1. PARSE TRANSAKSI: Ketika user menyebutkan transaksi (beli sesuatu, terima uang, dll), parse menjadi JSON dengan format:
{"parsed_transaction": {"nominal": number, "kategori": string, "deskripsi": string, "wallet": string, "tipe": "pemasukan"|"pengeluaran"}}

Kategori yang tersedia: Makanan & Minuman, Transportasi, Hiburan, Investasi, Belanja, Kesehatan, Pendidikan, Tagihan & Utilitas, Tabungan, Gaji & Penghasilan, Hadiah, Lainnya

2. ANALISIS KEUANGAN: Berikan insight, saran, dan analisis keuangan yang actionable.
3. JAWAB PERTANYAAN: Jawab pertanyaan seputar keuangan pribadi.

Jika user menyebut transaksi, SELALU sertakan JSON parsed_transaction di awal response, diikuti konfirmasi natural yang menyebut sisa budget untuk kategori tersebut (jika budget tersedia). Jika bukan transaksi, berikan jawaban yang helpful dan conversational. Gunakan emoji yang relevan untuk membuat percakapan lebih hidup.

PENTING: JANGAN gunakan markdown code blocks (triple backticks). Output JSON langsung inline dalam teks biasa.`;

const QUICK_PROMPTS = [
  "Barusan beli kopi 50rb pake QRIS, catat ya",
  "Terima gaji 8 juta dari transfer bank",
  "Analisa pengeluaranku bulan ini",
  "Apakah keuanganku aman?",
];

function stripTransactionJson(text: string): { text: string; parsed: ParsedTransaction | null } {
  let displayText = text.replace(/```json\s*|```/g, "");
  let parsed: ParsedTransaction | null = null;

  const txRegex = /\{["']?parsed_transaction["']?\s*:/;
  const jsonMatch = displayText.match(txRegex);
  if (jsonMatch) {
    const jsonStart = jsonMatch.index!;
    let depth = 0;
    let jsonEnd = jsonStart;
    for (let i = jsonStart; i < displayText.length; i++) {
      if (displayText[i] === "{") depth++;
      if (displayText[i] === "}") depth--;
      if (depth === 0) { jsonEnd = i + 1; break; }
    }
    const rawJson = displayText.slice(jsonStart, jsonEnd);
    const normalized = rawJson.replace(
      /(\{)\s*['"]?(parsed_transaction)['"]?\s*:/,
      '{"parsed_transaction":'
    );
    try {
      const parsedJson = JSON.parse(normalized);
      parsed = parsedJson.parsed_transaction;
    } catch {
      // JSON tak valid — tetap sembunyikan bloknya
    }
    displayText = (displayText.slice(0, jsonStart) + displayText.slice(jsonEnd)).trim();
  }

  return { text: displayText, parsed };
}

export default function AIAssistantPage() {
  const { user, wallets, transactions, monthTransactions, budgets } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Halo! Aku DuitQu AI 🤖✨\n\nAku bisa bantu kamu:\n• Catat transaksi dengan bahasa natural (\"beli kopi 50rb\")\n• Analisa keuangan bulananmu\n• Jawab pertanyaan seputar keuangan\n\nMau mulai dari mana?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<ParsedTransaction | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const lastRequestRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const financialContext = useMemo(() => {
    const thisMonthTx = monthTransactions.filter((t) => isThisMonth(t.date));
    const income = thisMonthTx.filter((t) => t.type === "IN").reduce((s, t) => s + t.amount, 0);
    const expense = thisMonthTx.filter((t) => t.type === "OUT").reduce((s, t) => s + t.amount, 0);
    const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

    const budgetDetails = budgets.map((b) => {
      const spent = thisMonthTx
        .filter((t) => t.type === "OUT" && t.category === b.category)
        .reduce((s, t) => s + t.amount, 0);
      const remaining = b.amount_limit - spent;
      return `${b.category}: limit ${formatCurrency(b.amount_limit)}, terpakai ${formatCurrency(spent)}, sisa ${Math.max(0, remaining) > 0 ? formatCurrency(remaining) : "habis (${formatCurrency(Math.abs(remaining))} over)"}`;
    }).join(" | ");

    return `
DATA KEUANGAN USER (bulan ini):
- Total saldo: ${formatCurrency(totalBalance)}
- Pemasukan bulan ini: ${formatCurrency(income)}
- Pengeluaran bulan ini: ${formatCurrency(expense)}
- Selisih: ${formatCurrency(income - expense)}
- Dompet: ${wallets.map((w) => `${w.name} (${formatCurrency(w.balance)})`).join(", ")}
- Budget: ${budgetDetails || "Tidak ada budget"}
- Transaksi terbaru: ${[...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((t) => `${t.description} ${formatCurrency(t.amount)} (${t.type})`).join(", ")}
    `;
  }, [wallets, transactions, monthTransactions, budgets]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat history from Supabase on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await getSupabaseClient()
        .from("ai_chats")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (data && data.length > 0) {
        type ChatRow = { role: string; content: string; parsed_transaction: unknown };
        setMessages((data as ChatRow[]).map((m) => {
          if (m.role === "assistant") {
            const cleaned = stripTransactionJson(m.content);
            return {
              role: "assistant" as const,
              content: cleaned.text,
              parsedTransaction: cleaned.parsed ?? (m.parsed_transaction as ParsedTransaction | undefined),
            };
          }
          return {
            role: "user" as const,
            content: m.content,
            parsedTransaction: undefined,
          };
        }));
      }
    })();
  }, [user]);

  async function handleClearChat() {
    if (!user) return;
    await getSupabaseClient().from("ai_chats").delete().eq("user_id", user.id);
    setMessages([{
      role: "assistant",
      content: "Halo! Aku DuitQu AI 🤖✨\n\nAku bisa bantu kamu:\n• Catat transaksi dengan bahasa natural (\"beli kopi 50rb\")\n• Analisa keuangan bulananmu\n• Jawab pertanyaan seputar keuangan\n\nMau mulai dari mana?",
    }]);
  }

  const sendMessage = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || isLoading || cooldown) return;

    const now = Date.now();
    if (now - lastRequestRef.current < 3000) {
      setCooldown(true);
      setTimeout(() => setCooldown(false), 3000);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Tunggu sebentar ya... ⏳ Kirim pesan terlalu cepat." },
      ]);
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setIsLoading(true);
    lastRequestRef.current = now;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userText },
          ],
          systemPrompt: SYSTEM_PROMPT + "\n\n" + financialContext,
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Maaf, terlalu banyak permintaan. Coba lagi dalam beberapa detik ya ⏳" },
        ]);
        setIsLoading(false);
        return;
      }

      const assistantText = data.text || "Maaf, ada kendala teknis.";

      const { text: displayText, parsed: parsedTx } = stripTransactionJson(assistantText);

      const assistantMsg = { role: "assistant" as const, content: displayText, parsedTransaction: parsedTx || undefined };
      setMessages((prev) => [...prev, assistantMsg]);

      if (parsedTx) {
        setPendingTransaction(parsedTx);
      }

      // Save to Supabase (fire-and-forget)
      getSupabaseClient().from("ai_chats").insert([
        { user_id: user!.id, role: "user", content: userText },
        { user_id: user!.id, role: "assistant", content: displayText, parsed_transaction: parsedTx ?? null },
      ]).then();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Maaf, ada gangguan koneksi. Coba lagi ya! 🙏" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  //layout page ai button send message and input field
  return (
    <>
      <div className="ai-shell">
        {/* Header */}
        <div className="ai-head">
          <div className="ai-head-row">
            <div className="ai-logo">
              <Bot size={20} color="var(--green)" />
            </div>
            <div>
              <h1 className="ai-name">DuitQu AI</h1>
              <p className="ai-status">● Online</p>
            </div>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="ai-clear-btn"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="ai-messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`ai-msg ${msg.role === "user" ? "ai-msg--user" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="ai-avatar ai-avatar--bot">
                  <Bot size={14} color="var(--green)" />
                </div>
              )}
              <div className={`ai-bubble-wrap ${msg.role === "user" ? "ai-bubble-wrap--user" : ""}`}>
                <div className={`ai-bubble ${msg.role === "user" ? "ai-bubble--user" : "ai-bubble--bot"}`}>
                  {msg.role === "assistant" ? <MarkdownText content={msg.content} /> : msg.content}
                </div>
                {msg.parsedTransaction && (
                  <div className="ai-tx-chip">
                    <p className="ai-tx-chip-label">💡 Transaksi terdeteksi:</p>
                    <p className="ai-tx-chip-line">{msg.parsedTransaction.tipe === "pemasukan" ? "+" : "-"}{formatCurrency(msg.parsedTransaction.nominal)} · {msg.parsedTransaction.kategori}</p>
                    <p className="ai-tx-chip-desc">{msg.parsedTransaction.deskripsi}</p>
                    {/* <button
                      onClick={() => setPendingTransaction(msg.parsedTransaction!)}
                      style={{ background: "var(--green)", color: "var(--on-accent)", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                    >
                      + Tambah ke Dompet
                    </button> */}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="ai-avatar ai-avatar--user">
                  <User size={14} color="var(--text-secondary)" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="ai-loading-row">
              <div className="ai-avatar ai-avatar--bot-loading">
                <Bot size={14} color="var(--green)" />
              </div>
              <div className="ai-typing">
                {/* <span style={{ display: "inline-flex", animation: "spin 1s linear infinite" }}>
                  <Loader2 size={14} color="var(--green)" />
                </span> */}
                <span className="ai-typing-text">Sedang berpikir...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="ai-prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="ai-prompt-chip"
              >
                {prompt}
              </button>
            ))}
          </div>

        {/* Input */}
        <div className="ai-input-bar">
          <input
            placeholder="Ketik pesan atau transaksi..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            className="ai-input"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className={`ai-send-btn ${input.trim() && !isLoading ? "ai-send-btn--on" : ""}`}
          >
            <Send size={16} color={input.trim() && !isLoading ? "var(--on-accent)" : "var(--text-faint)"} />
          </button>
        </div>
      </div>

      {pendingTransaction && (
        <LazyAddTransactionModal
          onClose={() => setPendingTransaction(null)}
          prefill={{
            amount: pendingTransaction.nominal,
            category: pendingTransaction.kategori,
            description: pendingTransaction.deskripsi,
            walletName: pendingTransaction.wallet,
            type: pendingTransaction.tipe === "pemasukan" ? "IN" : "OUT",
          }}
        />
      )}

      {showClearConfirm && (
        <ConfirmDialog
          title="Hapus semua riwayat chat?"
          description="Data chat yang sudah dihapus tidak bisa dikembalikan."
          onConfirm={() => {
            handleClearChat();
            setShowClearConfirm(false);
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </>
  );
}
