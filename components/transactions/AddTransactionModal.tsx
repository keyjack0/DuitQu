"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { CATEGORIES, Transaction } from "@/types";
import { X, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export interface AddTransactionModalProps {
  onClose: () => void;
  prefill?: {
    amount?: number;
    category?: string;
    description?: string;
    walletName?: string;
    type?: "IN" | "OUT";
  };
  editingTransaction?: Transaction;
}

export function AddTransactionModal({ onClose, prefill, editingTransaction }: AddTransactionModalProps) {
  const { user, wallets, addTransaction, updateTransaction } = useAppStore();
  const editing = editingTransaction;
  const [type, setType] = useState<"IN" | "OUT">(
    editing?.type === "IN" || editing?.type === "OUT"
      ? editing.type
      : prefill?.type || "OUT"
  );
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState(editing?.amount?.toString() || prefill?.amount?.toString() || "");
  const [category, setCategory] = useState(editing?.category || prefill?.category || CATEGORIES[0]);
  const [description, setDescription] = useState(editing?.description || prefill?.description || "");
  const [walletId, setWalletId] = useState(
    editing?.wallet_id ||
      wallets.find((w) => w.name.toLowerCase().includes(prefill?.walletName?.toLowerCase() || ""))?.id ||
      wallets[0]?.id ||
      ""
  );
  const [date, setDate] = useState(editing?.date || new Date().toISOString().split("T")[0]);

  const handleSubmit = () => {
    if (!amount || !walletId || submitting) return;
    setSubmitting(true);
    const parsedAmount = parseFloat(amount.replace(/\./g, "").replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (editing) {
      updateTransaction(editing.id, {
        type,
        amount: parsedAmount,
        category,
        description: description || category,
        date,
        wallet_id: walletId,
        to_wallet_id: editing.to_wallet_id,
      });
      onClose();
      return;
    }

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
      className="sheet-overlay sheet-overlay--fade"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sheet-panel sheet-panel--rise">
        {/* Header */}
        <div className="sheet-head">
          <h2 className="sheet-title">
            {editing ? "Edit Transaksi" : "Tambah Transaksi"}
          </h2>
          <button onClick={onClose} className="sheet-close">
            <X size={15} />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="type-toggle">
          {(["OUT", "IN"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`type-option ${type === t ? (t === "IN" ? "type-option--in" : "type-option--out") : ""}`}
            >
              {t === "IN" ? (
                <span className="type-option-label">
                  <ArrowUpCircle size={14} />
                  Pemasukan
                </span>
              ) : (
                <span className="type-option-label">
                  <ArrowDownCircle size={14} />
                  Pengeluaran
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Amount */}
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

        {/* Description */}
        <div className="form-field">
          <label className="form-label">Deskripsi</label>
          <input
            type="text"
            placeholder="Contoh: Makan siang, Gaji, dll."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Category */}
        <div className="form-field">
          <label className="form-label">Kategori</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-input"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Wallet */}
        <div className="form-field">
          <label className="form-label">Dari Dompet</label>
          <select
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            className="form-input"
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="form-field form-field--spaced">
          <label className="form-label">Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={!amount || !walletId || submitting} className="btn-primary">
          {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Transaksi"}
        </button>
      </div>
    </div>
  );
}
