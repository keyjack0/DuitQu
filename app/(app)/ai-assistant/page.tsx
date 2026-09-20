"use client";

/** Menyediakan percakapan AI untuk analisis keuangan dan pencatatan transaksi. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bot, EllipsisVertical, RotateCcw } from "lucide-react";
import { toast } from "react-toastify";
import { useShallow } from "zustand/react/shallow";
import { AssistantComposer } from "@/components/ai/AssistantComposer";
import { AssistantMessage } from "@/components/ai/AssistantMessage";
import { AssistantSkeleton } from "@/components/ai/AssistantSkeleton";
import { AssistantWelcome } from "@/components/ai/AssistantWelcome";
import { LazyAddTransactionModal } from "@/components/transactions/LazyAddTransactionModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  buildAssistantActions,
  buildAssistantSnapshot,
  normalizeParsedTransaction,
} from "@/lib/aiAssistant";
import { getSupabaseClient } from "@/lib/supabase";
import { useAppStore } from "@/lib/store";
import { formatCurrency, toLocalDateString } from "@/lib/utils";
import type { AIMessage, ParsedTransaction, Transaction } from "@/types";

interface ChatRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  parsed_transaction: unknown;
  created_at: string;
}

interface HistoryCursor {
  id: string;
  createdAt: string;
}

interface PendingTransaction {
  messageId: string;
  transaction: ParsedTransaction;
}

interface SendError {
  message: string;
  userText: string;
  userMessageId: string;
}

type ScrollAdjustment =
  | { type: "initial" }
  | { type: "prepend"; previousHeight: number; previousTop: number }
  | { type: "append"; smooth: boolean }
  | null;

const PAGE_SIZE = 50;

const SYSTEM_PROMPT = `Kamu adalah DuitQu AI, asisten keuangan pribadi yang cerdas dan ramah. Kamu berbicara dalam Bahasa Indonesia yang santai dan mudah dipahami.

Kemampuanmu:
1. PARSE TRANSAKSI: Ketika user menyebutkan transaksi (beli sesuatu, terima uang, dll), parse menjadi JSON dengan format:
{"parsed_transaction": {"nominal": number, "kategori": string, "deskripsi": string, "wallet": string, "tipe": "pemasukan"|"pengeluaran", "tanggal": "YYYY-MM-DD"}}

Kategori yang tersedia: Makanan & Minuman, Transportasi, Hiburan, Investasi, Belanja, Kesehatan, Pendidikan, Tagihan & Utilitas, Tabungan, Gaji & Penghasilan, Hadiah, Lainnya

Aturan parsing transaksi:
- Ubah singkatan nominal ke angka penuh. Contoh: 13rb menjadi 13000, 1,5jt menjadi 1500000, dan Rp13.000 menjadi 13000.
- Field nominal WAJIB berupa JSON number tanpa Rp, pemisah ribuan, atau akhiran rb/jt.
- Jika user tidak menyebut tanggal, gunakan TANGGAL HARI INI yang diberikan pada konteks.
- Field wallet hanya boleh memakai nama dompet dari DATA KEUANGAN USER. Jika tidak disebutkan atau tidak yakin, isi string kosong.

2. ANALISIS KEUANGAN: Berikan insight, saran, dan analisis keuangan yang actionable.
3. JAWAB PERTANYAAN: Jawab pertanyaan seputar keuangan pribadi.

Jika user menyebut transaksi, SELALU sertakan JSON parsed_transaction di awal response, diikuti konfirmasi natural yang menyebut sisa budget untuk kategori tersebut (jika budget tersedia). Jika bukan transaksi, berikan jawaban yang helpful dan conversational.

PENTING: JANGAN gunakan markdown code blocks (triple backticks). Output JSON langsung inline dalam teks biasa.`;

function stripTransactionJson(text: string): { text: string; parsed: ParsedTransaction | null } {
  let displayText = text.replace(/```(?:json)?\s*|```/gi, "");
  let parsed: ParsedTransaction | null = null;
  const jsonMatch = displayText.match(/\{["']?parsed_transaction["']?\s*:/);

  if (jsonMatch) {
    const jsonStart = jsonMatch.index!;
    let depth = 0;
    let jsonEnd = jsonStart;
    let inString = false;
    let escaped = false;
    for (let index = jsonStart; index < displayText.length; index++) {
      const character = displayText[index];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === "\\" && inString) {
        escaped = true;
        continue;
      }
      if (character === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (character === "{") depth++;
      if (character === "}") depth--;
      if (depth === 0) {
        jsonEnd = index + 1;
        break;
      }
    }
    const rawJson = displayText.slice(jsonStart, jsonEnd);
    const normalized = rawJson.replace(
      /(\{)\s*['"]?(parsed_transaction)['"]?\s*:/,
      '{"parsed_transaction":'
    );
    try {
      const parsedJson = JSON.parse(normalized) as { parsed_transaction?: unknown };
      parsed = normalizeParsedTransaction(parsedJson.parsed_transaction);
    } catch {
      // The natural-language confirmation is still useful when model JSON is malformed.
    }
    displayText = (displayText.slice(0, jsonStart) + displayText.slice(jsonEnd)).trim();
  }

  return { text: displayText, parsed };
}

function mapChatRow(row: ChatRow): AIMessage {
  if (row.role === "assistant") {
    const cleaned = stripTransactionJson(row.content);
    return {
      id: row.id,
      role: "assistant",
      content: cleaned.text,
      parsedTransaction: cleaned.parsed ?? normalizeParsedTransaction(row.parsed_transaction) ?? undefined,
      createdAt: row.created_at,
    };
  }
  return { id: row.id, role: "user", content: row.content, createdAt: row.created_at };
}

function sortMessagesChronologically(messages: AIMessage[]): AIMessage[] {
  return [...messages].sort((a, b) => {
    const timeComparison = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
    if (timeComparison !== 0) return timeComparison;
    if (a.role !== b.role) return a.role === "user" ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
}

export default function AIAssistantPage() {
  const {
    user,
    wallets,
    transactions,
    monthTransactions,
    lastMonthTransactions,
    budgets,
    financialGoals,
    isDataLoading,
  } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      wallets: state.wallets,
      transactions: state.transactions,
      monthTransactions: state.monthTransactions,
      lastMonthTransactions: state.lastMonthTransactions,
      budgets: state.budgets,
      financialGoals: state.financialGoals,
      isDataLoading: state.isLoading,
    }))
  );
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<PendingTransaction | null>(null);
  const [sendError, setSendError] = useState<SendError | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const [historyReloadKey, setHistoryReloadKey] = useState(0);
  const [cooldown, setCooldown] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const operationRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const clearButtonRef = useRef<HTMLButtonElement>(null);
  const lastRequestRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const historyCursorRef = useRef<HistoryCursor | null>(null);
  const loadingOlderRef = useRef(false);
  const scrollAdjustmentRef = useRef<ScrollAdjustment>(null);
  const userId = user?.id;
  const isHistoryLoading = !userId || loadedUserId !== userId;
  const isBusy = isHistoryLoading || isLoading || isClearing || isLoadingOlder;

  const snapshot = useMemo(() => buildAssistantSnapshot({
    wallets,
    monthTransactions,
    lastMonthTransactions,
    budgets,
    goals: financialGoals,
  }), [wallets, monthTransactions, lastMonthTransactions, budgets, financialGoals]);
  const actions = useMemo(
    () => buildAssistantActions(snapshot, wallets.length),
    [snapshot, wallets.length]
  );

  const financialContext = useMemo(() => {
    const budgetDetails = budgets
      .filter((budget) => budget.period === "MONTH")
      .map((budget) => {
        const spent = monthTransactions
          .filter((transaction) => transaction.type === "OUT" && transaction.category === budget.category)
          .reduce((total, transaction) => total + transaction.amount, 0);
        return `${budget.category}: limit ${formatCurrency(budget.amount_limit)}, terpakai ${formatCurrency(spent)}, sisa ${formatCurrency(Math.max(0, budget.amount_limit - spent))}`;
      })
      .join(" | ");
    const goalDetails = financialGoals
      .map((goal) => `${goal.name}: ${formatCurrency(goal.current_amount)} dari ${formatCurrency(goal.target_amount)}`)
      .join(" | ");
    const latestTransactions = [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((transaction) => `${transaction.description} ${formatCurrency(transaction.amount)} (${transaction.type})`)
      .join(", ");

    return `
DATA KEUANGAN USER (bulan ini):
- Total saldo: ${formatCurrency(snapshot.totalBalance)}
- Pemasukan: ${formatCurrency(snapshot.income)}
- Pengeluaran: ${formatCurrency(snapshot.expense)}
- Selisih: ${formatCurrency(snapshot.net)}
- Savings rate: ${snapshot.savingsRate === null ? "belum tersedia" : `${snapshot.savingsRate}%`}
- Dompet: ${wallets.map((wallet) => `${wallet.name} (${formatCurrency(wallet.balance)})`).join(", ") || "Tidak ada dompet"}
- Budget bulanan: ${budgetDetails || "Tidak ada budget"}
- Target keuangan: ${goalDetails || "Tidak ada target"}
- Transaksi terbaru: ${latestTransactions || "Tidak ada transaksi"}`;
  }, [budgets, financialGoals, monthTransactions, snapshot, transactions, wallets]);

  useEffect(() => {
    if (!showMenu) return;
    clearButtonRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setShowMenu(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowMenu(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showMenu]);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    const adjustment = scrollAdjustmentRef.current;
    if (!container || !adjustment) return;
    if (adjustment.type === "initial" && isHistoryLoading) return;
    if (adjustment.type === "prepend") {
      container.scrollTop = adjustment.previousTop + container.scrollHeight - adjustment.previousHeight;
    } else if (adjustment.type === "initial") {
      container.scrollTop = container.scrollHeight;
    } else {
      container.scrollTo({ top: container.scrollHeight, behavior: adjustment.smooth ? "smooth" : "auto" });
    }
    scrollAdjustmentRef.current = null;
  }, [messages, isHistoryLoading]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    scrollAdjustmentRef.current = null;
    historyCursorRef.current = null;
    loadingOlderRef.current = false;
    void (async () => {
      try {
        const { data, error } = await getSupabaseClient()
          .from("ai_chats")
          .select("id, role, content, parsed_transaction, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(PAGE_SIZE + 1);
        if (cancelled) return;
        if (error) throw error;
        setHistoryError(false);
        const rows = (data ?? []) as ChatRow[];
        const pageRows = rows.slice(0, PAGE_SIZE);
        const oldestRow = pageRows.at(-1);
        historyCursorRef.current = oldestRow ? { id: oldestRow.id, createdAt: oldestRow.created_at } : null;
        setHasMoreHistory(rows.length > PAGE_SIZE);
        scrollAdjustmentRef.current = { type: "initial" };
        setMessages(sortMessagesChronologically(pageRows.map(mapChatRow)));
      } catch {
        if (!cancelled) {
          setMessages([]);
          setHistoryError(true);
        }
      } finally {
        if (!cancelled) setLoadedUserId(userId);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, historyReloadKey]);

  async function loadOlderMessages() {
    const cursor = historyCursorRef.current;
    if (!userId || loadedUserId !== userId || !hasMoreHistory || !cursor || loadingOlderRef.current || isLoading || isClearing) return;
    loadingOlderRef.current = true;
    setIsLoadingOlder(true);
    try {
      const { data, error } = await getSupabaseClient()
        .from("ai_chats")
        .select("id, role, content, parsed_transaction, created_at")
        .eq("user_id", userId)
        .or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(PAGE_SIZE + 1);
      if (error) throw error;
      const rows = (data ?? []) as ChatRow[];
      const pageRows = rows.slice(0, PAGE_SIZE);
      const oldestRow = pageRows.at(-1);
      const container = messagesContainerRef.current;
      setHasMoreHistory(rows.length > PAGE_SIZE);
      if (oldestRow) historyCursorRef.current = { id: oldestRow.id, createdAt: oldestRow.created_at };
      if (pageRows.length > 0 && container) {
        scrollAdjustmentRef.current = {
          type: "prepend",
          previousHeight: container.scrollHeight,
          previousTop: container.scrollTop,
        };
        setMessages((current) => {
          const byId = new Map(current.map((message) => [message.id, message]));
          for (const row of pageRows) byId.set(row.id, mapChatRow(row));
          return sortMessagesChronologically([...byId.values()]);
        });
      }
    } catch {
      toast.error("Gagal memuat pesan sebelumnya.");
    } finally {
      loadingOlderRef.current = false;
      setIsLoadingOlder(false);
    }
  }

  function isNearBottom() {
    const container = messagesContainerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 120;
  }

  async function handleClearChat() {
    if (!userId || isBusy || operationRef.current) return;
    operationRef.current = true;
    setIsClearing(true);
    setShowClearConfirm(false);
    try {
      const { error } = await getSupabaseClient().from("ai_chats").delete().eq("user_id", userId);
      if (error) throw error;
      historyCursorRef.current = null;
      setHasMoreHistory(false);
      setMessages([]);
      setPendingTransaction(null);
      setSendError(null);
    } catch {
      toast.error("Gagal menghapus riwayat chat. Silakan coba lagi.");
    } finally {
      operationRef.current = false;
      setIsClearing(false);
      menuButtonRef.current?.focus();
    }
  }

  async function sendMessage(text?: string, replaceMessageId?: string) {
    const userText = text || input.trim();
    if (!userText || !userId || isBusy || showClearConfirm || operationRef.current || cooldown) return;
    const now = Date.now();
    if (now - lastRequestRef.current < 3000) {
      setCooldown(true);
      setTimeout(() => setCooldown(false), 3000);
      setSendError({ message: "Tunggu beberapa detik sebelum mengirim pesan lagi.", userText, userMessageId: replaceMessageId ?? "" });
      return;
    }

    const sentAt = new Date().toISOString();
    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userText,
      createdAt: sentAt,
    };
    operationRef.current = true;
    setInput("");
    setSendError(null);
    scrollAdjustmentRef.current = { type: "append", smooth: true };
    setMessages((current) => [...current.filter((message) => message.id !== replaceMessageId), userMessage]);
    setIsLoading(true);
    lastRequestRef.current = now;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const historyMessages = messages.filter((message) => message.id !== replaceMessageId);
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [
            ...historyMessages.slice(-PAGE_SIZE).map((message) => ({ role: message.role, content: message.content })),
            { role: "user", content: userText },
          ],
          systemPrompt: `${SYSTEM_PROMPT}\n\nTANGGAL HARI INI: ${toLocalDateString(new Date())}\n\n${financialContext}`,
        }),
      });
      const data = await response.json() as { text?: string; error?: string };
      if (!response.ok) {
        const message = response.status === 429
          ? "Permintaan terlalu cepat. Coba lagi dalam beberapa detik."
          : data.error || "DuitQu AI sedang mengalami kendala.";
        throw new Error(message);
      }
      if (!data.text?.trim()) throw new Error("AI tidak mengirim jawaban. Silakan coba lagi.");

      const { text: displayText, parsed } = stripTransactionJson(data.text);
      const assistantAt = new Date().toISOString();
      const assistantMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: displayText,
        parsedTransaction: parsed ?? undefined,
        createdAt: assistantAt,
      };
      if (isNearBottom()) scrollAdjustmentRef.current = { type: "append", smooth: true };
      setMessages((current) => [...current, assistantMessage]);

      const { error } = await getSupabaseClient().from("ai_chats").insert([
        { id: userMessage.id, user_id: userId, role: "user", content: userText, created_at: sentAt },
        {
          id: assistantMessage.id,
          user_id: userId,
          role: "assistant",
          content: displayText,
          parsed_transaction: parsed ?? null,
          created_at: assistantAt,
        },
      ]);
      if (error) toast.error("Jawaban tampil, tetapi riwayat chat gagal disimpan.");
      if (parsed) {
        setPendingTransaction({ messageId: assistantMessage.id, transaction: parsed });
      }
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === "AbortError";
      setSendError({
        message: aborted ? "Jawaban dihentikan." : error instanceof Error ? error.message : "Gagal terhubung ke DuitQu AI.",
        userText,
        userMessageId: userMessage.id,
      });
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
      operationRef.current = false;
      setIsLoading(false);
    }
  }

  function handleReviewTransaction(message: AIMessage) {
    if (!message.parsedTransaction || message.parsedTransaction.status === "saved") return;
    setPendingTransaction({ messageId: message.id, transaction: message.parsedTransaction });
  }

  async function handleTransactionSaved(transaction: Transaction) {
    if (!pendingTransaction || !userId) return;
    const updated: ParsedTransaction = {
      ...pendingTransaction.transaction,
      status: "saved",
      transactionId: transaction.id,
      walletId: transaction.wallet_id ?? undefined,
      wallet: wallets.find((wallet) => wallet.id === transaction.wallet_id)?.name ?? pendingTransaction.transaction.wallet,
      tanggal: transaction.date,
    };
    setMessages((current) => current.map((message) =>
      message.id === pendingTransaction.messageId ? { ...message, parsedTransaction: updated } : message
    ));
    const { error } = await getSupabaseClient()
      .from("ai_chats")
      .update({ parsed_transaction: updated })
      .eq("id", pendingTransaction.messageId)
      .eq("user_id", userId);
    if (error) toast.error("Transaksi tersimpan, tetapi status kartu gagal diperbarui.");
    setPendingTransaction(null);
  }

  function retryFailedMessage() {
    if (!sendError) return;
    const failed = sendError;
    setSendError(null);
    void sendMessage(failed.userText, failed.userMessageId);
  }

  return (
    <>
      <div className="ai-shell">
        <header className="ai-head">
          <div className="ai-head-row">
            <div className="ai-logo"><Bot size={23} strokeWidth={1.8} aria-hidden="true" /></div>
            <div>
              <h1 className="ai-name">DuitQu AI</h1>
              <p className="ai-status">Asisten keuangan pribadi</p>
            </div>
            <div
              className="ai-menu-wrap"
              ref={menuRef}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setShowMenu(false);
              }}
            >
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setShowMenu((open) => !open)}
                className="ai-menu-btn"
                aria-label="Opsi chat"
                aria-haspopup="menu"
                aria-expanded={showMenu}
                aria-controls={showMenu ? "ai-chat-menu" : undefined}
              >
                <EllipsisVertical size={20} aria-hidden="true" />
              </button>
              {showMenu && (
                <div id="ai-chat-menu" className="ai-menu" role="menu" aria-label="Opsi chat">
                  <button
                    ref={clearButtonRef}
                    type="button"
                    role="menuitem"
                    className="ai-menu-item"
                    disabled={isBusy || messages.length === 0}
                    onClick={() => {
                      setShowMenu(false);
                      setShowClearConfirm(true);
                    }}
                  >
                    {isClearing ? "Menghapus riwayat..." : "Hapus riwayat chat"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="ai-layout">
          <aside className="ai-sidebar" aria-label="Ringkasan keuangan">
            {isDataLoading ? <AssistantSkeleton /> : (
              <AssistantWelcome
                name={user?.name}
                snapshot={snapshot}
                actions={actions}
                onPrompt={(prompt) => void sendMessage(prompt)}
                compact
              />
            )}
          </aside>

          <section className="ai-chat-panel" aria-label="Percakapan dengan DuitQu AI">
            <div
              ref={messagesContainerRef}
              className="ai-messages"
              role="log"
              aria-label="Riwayat percakapan"
              onScroll={(event) => {
                if (event.currentTarget.scrollTop <= 80) void loadOlderMessages();
              }}
            >
              {(isHistoryLoading || (isDataLoading && messages.length === 0)) && <AssistantSkeleton />}

              {!isHistoryLoading && isLoadingOlder && (
                <div className="ai-history-loading" role="status">Memuat pesan sebelumnya...</div>
              )}

              {!isHistoryLoading && historyError && (
                <div className="ai-state-card" role="alert">
                  <p>Riwayat chat belum bisa dimuat.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryError(false);
                      setLoadedUserId(null);
                      setHistoryReloadKey((key) => key + 1);
                    }}
                  >
                    <RotateCcw size={14} aria-hidden="true" /> Coba lagi
                  </button>
                </div>
              )}

              {!isHistoryLoading && !historyError && messages.length === 0 && !isDataLoading && (
                <>
                  <div className="ai-mobile-welcome">
                    <AssistantWelcome
                      name={user?.name}
                      snapshot={snapshot}
                      actions={actions}
                      onPrompt={(prompt) => void sendMessage(prompt)}
                    />
                  </div>
                  <div className="ai-desktop-empty">
                    <span><Bot size={24} aria-hidden="true" /></span>
                    <h2>Mulai percakapan</h2>
                    <p>Pilih salah satu saran di samping atau tulis pertanyaanmu.</p>
                  </div>
                </>
              )}

              {!isHistoryLoading && messages.map((message) => (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  onReviewTransaction={handleReviewTransaction}
                />
              ))}

              {!isHistoryLoading && sendError && (
                <div className="ai-error-card" role="alert">
                  <p>{sendError.message}</p>
                  {sendError.userText && (
                    <button type="button" onClick={retryFailedMessage} disabled={isBusy || cooldown}>
                      <RotateCcw size={14} aria-hidden="true" /> Coba lagi
                    </button>
                  )}
                </div>
              )}

              {!isHistoryLoading && isLoading && (
                <div className="ai-loading-row" role="status" aria-live="polite">
                  <div className="ai-avatar ai-avatar--bot-loading"><Bot size={14} aria-hidden="true" /></div>
                  <div className="ai-typing"><span className="ai-typing-dot" /><span className="ai-typing-text">Menganalisis keuangan...</span></div>
                </div>
              )}
            </div>

            {!isHistoryLoading && messages.length > 0 && !isLoading && (
              <div className="ai-prompts" aria-label="Saran pertanyaan">
                {actions.map((action) => action.kind === "link" ? (
                  <Link key={action.label} href={action.href} className="ai-prompt-chip">
                    {action.label}
                  </Link>
                ) : (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => void sendMessage(action.prompt)}
                    disabled={isBusy || cooldown}
                    className="ai-prompt-chip"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            <AssistantComposer
              value={input}
              onChange={setInput}
              onSend={() => void sendMessage()}
              onStop={() => abortControllerRef.current?.abort()}
              disabled={isHistoryLoading || isClearing || cooldown || showClearConfirm}
              isLoading={isLoading}
            />
          </section>
        </div>
      </div>

      {pendingTransaction && (
        <LazyAddTransactionModal
          onClose={() => setPendingTransaction(null)}
          onSaved={(transaction) => void handleTransactionSaved(transaction)}
          prefill={{
            amount: pendingTransaction.transaction.nominal,
            category: pendingTransaction.transaction.kategori,
            description: pendingTransaction.transaction.deskripsi,
            walletName: pendingTransaction.transaction.wallet,
            walletId: pendingTransaction.transaction.walletId,
            type: pendingTransaction.transaction.tipe === "pemasukan" ? "IN" : "OUT",
            date: pendingTransaction.transaction.tanggal,
          }}
        />
      )}

      {showClearConfirm && (
        <ConfirmDialog
          title="Hapus semua riwayat chat?"
          description="Data chat yang sudah dihapus tidak bisa dikembalikan."
          onConfirm={() => void handleClearChat()}
          onCancel={() => {
            setShowClearConfirm(false);
            menuButtonRef.current?.focus();
          }}
        />
      )}
    </>
  );
}
