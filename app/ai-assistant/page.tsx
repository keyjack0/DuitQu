"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency, isThisMonth } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import { LazyAddTransactionModal } from "@/components/transactions/LazyAddTransactionModal";
import { Bot, Send, Sparkles, User, Loader2, Trash2 } from "lucide-react";
import { ParsedTransaction } from "@/types";
import { getSupabaseClient } from "@/lib/supabase";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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

export default function AIAssistantPage() {
  const { user, wallets, transactions, budgets } = useAppStore();
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
    const thisMonthTx = transactions.filter((t) => isThisMonth(t.date));
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
  }, [wallets, transactions, budgets]);

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
        setMessages((data as ChatRow[]).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          parsedTransaction: m.parsed_transaction as ParsedTransaction | undefined,
        })));
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

      let parsedTx: ParsedTransaction | null = null;
      let displayText = assistantText.replace(/```json\s*|```/g, "");

      const txRegex = /\{["']?parsed_transaction["']?\s*:/;
      const jsonMatch = displayText.match(txRegex);
      if (jsonMatch) {
        let depth = 0;
        let jsonEnd = jsonMatch.index!;
        for (let i = jsonMatch.index!; i < displayText.length; i++) {
          if (displayText[i] === "{") depth++;
          if (displayText[i] === "}") depth--;
          if (depth === 0) { jsonEnd = i + 1; break; }
        }
        let jsonStr = displayText.slice(jsonMatch.index!, jsonEnd);
        jsonStr = jsonStr.replace(/(\{)\s*['"]?(parsed_transaction)['"]?\s*:/, '{"parsed_transaction":');
        try {
          const parsed = JSON.parse(jsonStr);
          parsedTx = parsed.parsed_transaction;
          displayText = displayText.replace(jsonStr, "").trim();
        } catch {}
      }

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

  return (
    <AppLayout>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", paddingBottom: "80px" }}>
        {/* Header */}
        <div style={{ padding: "56px 20px 16px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "rgba(34, 197, 94, 0.12)",
                border: "1px solid rgba(34, 197, 94, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={20} color="var(--green)" />
            </div>
            <div>
              <h1 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>DuitQu AI</h1>
              <p style={{ fontSize: "11px", color: "var(--green)" }}>● Online</p>
            </div>
            <button
              onClick={() => setShowClearConfirm(true)}
              style={{
                marginLeft: "auto",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-faint)",
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                animation: "slideUp 0.3s ease",
              }}
            >
              {msg.role === "assistant" && (
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "4px" }}>
                  <Bot size={14} color="var(--green)" />
                </div>
              )}
              <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: "6px", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    background: msg.role === "user" ? "var(--green)" : "var(--bg-card)",
                    color: msg.role === "user" ? "var(--on-accent)" : "var(--text-primary)",
                    border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    padding: "10px 14px",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.content}
                </div>
                {msg.parsedTransaction && (
                  <div
                    style={{
                      background: "rgba(34, 197, 94, 0.08)",
                      border: "1px solid rgba(34, 197, 94, 0.25)",
                      borderRadius: "10px",
                      padding: "10px 12px",
                      fontSize: "12px",
                    }}
                  >
                    <p style={{ color: "var(--green)", fontWeight: 600, marginBottom: "4px" }}>💡 Transaksi terdeteksi:</p>
                    <p style={{ color: "var(--text-secondary)" }}>{msg.parsedTransaction.tipe === "pemasukan" ? "+" : "-"}{formatCurrency(msg.parsedTransaction.nominal)} · {msg.parsedTransaction.kategori}</p>
                    <p style={{ color: "var(--text-muted)", marginBottom: "8px" }}>{msg.parsedTransaction.deskripsi}</p>
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
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--bg-hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "4px" }}>
                  <User size={14} color="var(--text-secondary)" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div style={{ display: "flex", gap: "10px", animation: "fadeIn 0.3s ease" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={14} color="var(--green)" />
              </div>
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px 16px 16px 4px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "6px" }}>
                {/* <span style={{ display: "inline-flex", animation: "spin 1s linear infinite" }}>
                  <Loader2 size={14} color="var(--green)" />
                </span> */}
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Sedang berpikir...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div style={{ padding: "0 20px 12px", display: "flex", gap: "8px", overflowX: "auto", flexShrink: 0 }}>
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                style={{
                  padding: "7px 12px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "20px",
                  color: "var(--text-secondary)",
                  fontSize: "12px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "border-color 0.2s",
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

        {/* Input */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", background: "var(--bg-primary)", flexShrink: 0, display: "flex", gap: "10px" }}>
          <input
            placeholder="Ketik pesan atau transaksi..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            style={{
              flex: 1,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "10px 14px",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: input.trim() && !isLoading ? "var(--green)" : "var(--border)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
              flexShrink: 0,
            }}
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
    </AppLayout>
  );
}
