"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { X, ArrowLeftRight } from "lucide-react";

interface TransferModalProps {
  onClose: () => void;
}

export function TransferModal({ onClose }: TransferModalProps) {
  const { user, wallets, addTransaction } = useAppStore();
  const [fromWallet, setFromWallet] = useState(wallets[0]?.id || "");
  const [toWallet, setToWallet] = useState(wallets[1]?.id || wallets[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  const formatAmount = (val: string) => {
    const num = val.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleSubmit = () => {
    if (!amount || !fromWallet || !toWallet || fromWallet === toWallet || submitting) return;
    setSubmitting(true);
    const parsedAmount = parseFloat(amount.replace(/\./g, ""));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    addTransaction({
      id: crypto.randomUUID(),
      user_id: user!.id,
      wallet_id: fromWallet,
      type: "TRANSFER",
      amount: parsedAmount,
      category: "Transfer",
      description: `Transfer ke ${wallets.find((w) => w.id === toWallet)?.name || "dompet lain"}`,
      date,
      to_wallet_id: toWallet,
    });

    onClose();
  };

  const canSubmit = amount && fromWallet && toWallet && fromWallet !== toWallet && !submitting;

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>
            Transfer Antar Dompet
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

        {wallets.length < 2 ? (
          <p style={{ fontSize: "14px", color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
            Kamu butuh minimal 2 dompet untuk transfer. Tambah dompet dulu ya!
          </p>
        ) : (
          <>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Dari Dompet</label>
              <select
                value={fromWallet}
                onChange={(e) => setFromWallet(e.target.value)}
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
                    {w.name} ({formatCurrency(w.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
              <ArrowLeftRight size={18} color="var(--text-muted)" />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Ke Dompet</label>
              <select
                value={toWallet}
                onChange={(e) => setToWallet(e.target.value)}
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
                {wallets
                  .filter((w) => w.id !== fromWallet)
                  .map((w) => (
                    <option key={w.id} value={w.id} style={{ background: "var(--bg-card)" }}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
              </select>
            </div>

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

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                width: "100%",
                padding: "14px",
                background: canSubmit ? "var(--green)" : "var(--border)",
                color: canSubmit ? "var(--on-accent)" : "var(--text-muted)",
                border: "none",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "15px",
                cursor: canSubmit ? "pointer" : "not-allowed",
                transition: "all 0.2s",
              }}
            >
              {submitting ? "Menyimpan..." : "Transfer"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}