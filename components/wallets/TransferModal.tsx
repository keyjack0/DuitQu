"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency, toLocalDateString } from "@/lib/utils";
import { X, ArrowLeftRight } from "lucide-react";

interface TransferModalProps {
  onClose: () => void;
}

export function TransferModal({ onClose }: TransferModalProps) {
  const { user, wallets, addTransaction } = useAppStore();
  const [fromWallet, setFromWallet] = useState(wallets[0]?.id || "");
  const [toWallet, setToWallet] = useState(wallets[1]?.id || wallets[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toLocalDateString(new Date()));
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
      className="sheet-overlay sheet-overlay--fade"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sheet-panel sheet-panel--rise">
        <div className="sheet-head">
          <h2 className="sheet-title">Transfer Antar Dompet</h2>
          <button onClick={onClose} className="sheet-close">
            <X size={15} />
          </button>
        </div>

        {wallets.length < 2 ? (
          <p className="text-sm text-muted text-center py-6">
            Kamu butuh minimal 2 dompet untuk transfer. Tambah dompet dulu ya!
          </p>
        ) : (
          <>
            <div className="form-field">
              <label className="form-label">Dari Dompet</label>
              <select
                value={fromWallet}
                onChange={(e) => setFromWallet(e.target.value)}
                className="form-input"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatCurrency(w.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center mb-3.5">
              <ArrowLeftRight size={18} color="var(--text-muted)" />
            </div>

            <div className="form-field">
              <label className="form-label">Ke Dompet</label>
              <select
                value={toWallet}
                onChange={(e) => setToWallet(e.target.value)}
                className="form-input"
              >
                {wallets
                  .filter((w) => w.id !== fromWallet)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Nominal</label>
              <div className="relative">
                <span className="input-prefix input-prefix--lg">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(formatAmount(e.target.value))}
                  className="form-input form-input--amount"
                />
              </div>
            </div>

            <div className="form-field form-field--spaced">
              <label className="form-label">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
              />
            </div>

            <button onClick={handleSubmit} disabled={!canSubmit} className="btn-primary">
              {submitting ? "Menyimpan..." : "Transfer"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
