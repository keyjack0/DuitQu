"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { CATEGORIES, TransactionType } from "@/types";
import { X, Sparkles, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export interface AddTransactionModalProps {
  onClose: () => void;
  prefill?: {
    amount?: number;
    category?: string;
    description?: string;
    walletName?: string;
    type?: "IN" | "OUT";
  };
}

export function AddTransactionModal({ onClose, prefill }: AddTransactionModalProps) {
  const { user, wallets, addTransaction } = useAppStore();
  const [type, setType] = useState<"IN" | "OUT">(prefill?.type || "OUT");
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState(prefill?.amount?.toString() || "");
  const [category, setCategory] = useState(prefill?.category || CATEGORIES[0]);
  const [description, setDescription] = useState(prefill?.description || "");
  const [walletId, setWalletId] = useState(
    wallets.find((w) => w.name.toLowerCase().includes(prefill?.walletName?.toLowerCase() || ""))?.id ||
      wallets[0]?.id ||
      ""
  );
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = () => {
    if (!amount || !walletId || submitting) return;
    setSubmitting(true);
    const parsedAmount = parseFloat(amount.replace(/\./g, "").replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const id = crypto.randomUUID();

    addTransaction({
      id,
      user_id: user!.id,
      wallet_id: walletId,
      type,
      amount: parsedAmount,
      category,
      description: description || category,
      date,
      to_wallet_id: null,
    });

    onClose();
  };

  const formatAmount = (val: string) => {
    const num = val.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-end",
        zIndex: 200,
        animation: "fadeIn 0.2s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%",
          background: "var(--bg-secondary)",
          borderRadius: "20px 20px 0 0",
          border: "1px solid var(--border)",
          borderBottom: "none",
          padding: "24px 20px 40px",
          animation: "slideUp 0.3s ease",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>
            Tambah Transaksi
          </h2>
          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Type Toggle */}
        <div
          style={{
            display: "flex",
            background: "var(--bg-card)",
            borderRadius: "10px",
            padding: "4px",
            marginBottom: "20px",
            border: "1px solid var(--border)",
          }}
        >
          {(["OUT", "IN"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                background:
                  type === t
                    ? t === "IN"
                      ? "var(--green)"
                      : "var(--text-primary)"
                    : "transparent",
                color:
                  type === t
                    ? "var(--on-accent)"
                    : "var(--text-muted)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {t === "IN" ? (
                <span style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                  <ArrowUpCircle size={14} />
                  Pemasukan
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                  <ArrowDownCircle size={14} />
                  Pengeluaran
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Nominal</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "14px" }}>Rp</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(formatAmount(e.target.value))}
              style={{
                width: "100%",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "12px 14px 12px 40px",
                color: "var(--text-primary)",
                fontSize: "18px",
                fontWeight: 700,
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Deskripsi</label>
          <input
            type="text"
            placeholder="Contoh: Makan siang, Gaji, dll."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Kategori</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: "100%",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none",
            }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} style={{ background: "var(--bg-card)" }}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Wallet */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Dari Dompet</label>
          <select
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            style={{
              width: "100%",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none",
            }}
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id} style={{ background: "var(--bg-card)" }}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: "100%",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!amount || !walletId || submitting}
          style={{
            width: "100%",
            padding: "14px",
            background: amount && walletId && !submitting ? "var(--green)" : "var(--border)",
            color: amount && walletId && !submitting ? "var(--on-accent)" : "var(--text-muted)",
            border: "none",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "15px",
            cursor: amount && walletId && !submitting ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}
        >
          {submitting ? "Menyimpan..." : "Simpan Transaksi"}
        </button>
      </div>
    </div>
  );
}
