"use client";

/** Menyediakan dialog untuk menambah atau mengubah transaksi. */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useAppStore } from "@/lib/store";
import { CATEGORIES, Transaction } from "@/types";
import { toLocalDateString } from "@/lib/utils";
import { X, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

export interface AddTransactionModalProps {
  onClose: () => void;
  onSaved?: (transaction: Transaction) => void;
  prefill?: {
    amount?: number;
    category?: string;
    description?: string;
    walletName?: string;
    walletId?: string;
    type?: "IN" | "OUT";
    date?: string;
  };
  editingTransaction?: Transaction;
}

export function AddTransactionModal({ onClose, onSaved, prefill, editingTransaction }: AddTransactionModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { user, wallets, addTransaction, updateTransaction } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      wallets: state.wallets,
      addTransaction: state.addTransaction,
      updateTransaction: state.updateTransaction,
    }))
  );
  const editing = editingTransaction;
  const [type, setType] = useState<"IN" | "OUT">(
    editing?.type === "IN" || editing?.type === "OUT"
      ? editing.type
      : prefill?.type || "OUT"
  );
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState(editing?.amount?.toString() || prefill?.amount?.toString() || "");
  const prefillCategory = prefill?.category && CATEGORIES.includes(prefill.category)
    ? prefill.category
    : CATEGORIES[0];
  const matchingWalletId = prefill?.walletId && wallets.some((wallet) => wallet.id === prefill.walletId)
    ? prefill.walletId
    : prefill?.walletName
      ? wallets.find((wallet) => wallet.name.toLowerCase().includes(prefill.walletName!.toLowerCase()))?.id
      : undefined;
  const hasWalletPrefill = Boolean(prefill?.walletId || prefill?.walletName?.trim());
  const [category, setCategory] = useState(editing?.category || prefillCategory);
  const [description, setDescription] = useState(editing?.description || prefill?.description || "");
  const [walletId, setWalletId] = useState(
    editing?.wallet_id ||
      matchingWalletId ||
      (!hasWalletPrefill ? wallets[0]?.id : undefined) ||
      ""
  );
  const [date, setDate] = useState(editing?.date || prefill?.date || toLocalDateString(new Date()));
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const controls = [...dialogRef.current.querySelectorAll<HTMLElement>(
        "button:not(:disabled), input:not(:disabled), select:not(:disabled)"
      )];
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const parsedAmount = parseFloat(amount.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setValidationError("Masukkan nominal lebih dari Rp0.");
      return;
    }
    if (!walletId) {
      setValidationError("Pilih dompet untuk transaksi ini.");
      return;
    }
    if (!user) {
      setValidationError("Sesi pengguna belum siap. Coba lagi sebentar.");
      return;
    }

    setValidationError("");
    setSubmitting(true);

    if (editing) {
      const updatedTransaction: Transaction = {
        ...editing,
        type,
        amount: parsedAmount,
        category,
        description: description || category,
        date,
        wallet_id: walletId,
        to_wallet_id: editing.to_wallet_id,
      };
      const saved = await updateTransaction(editing.id, updatedTransaction);
      if (!saved) {
        setSubmitting(false);
        return;
      }
      onSaved?.(updatedTransaction);
      onClose();
      return;
    }

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      user_id: user.id,
      wallet_id: walletId,
      type,
      amount: parsedAmount,
      category,
      description: description || category,
      date,
      to_wallet_id: null,
      created_at: new Date().toISOString(),
    };

    const saved = await addTransaction(transaction);
    if (!saved) {
      setSubmitting(false);
      return;
    }
    onSaved?.(transaction);
    onClose();
  };

  const formatAmount = (val: string) => {
    const num = val.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <div
      className="sheet-overlay sheet-overlay--fade transaction-sheet-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        className="sheet-panel sheet-panel--rise transaction-sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-dialog-title"
      >
        {/* Header */}
        <div className="sheet-head">
          <h2 id="transaction-dialog-title" className="sheet-title">
            {editing ? "Edit Transaksi" : "Tambah Transaksi"}
          </h2>
          <button type="button" onClick={onClose} className="sheet-close" aria-label="Tutup form transaksi">
            <X size={15} />
          </button>
        </div>

        {wallets.length === 0 ? (
          <div className="transaction-no-wallet">
            <p className="transaction-no-wallet-title">Dompet diperlukan</p>
            <p>Tambahkan dompet terlebih dahulu sebelum mencatat transaksi.</p>
            <Link href="/wallets" className="btn-primary" onClick={onClose}>Buka Halaman Dompet</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="type-toggle" role="group" aria-label="Tipe transaksi">
              {(["OUT", "IN"] as const).map((transactionType) => (
                <button
                  key={transactionType}
                  type="button"
                  onClick={() => setType(transactionType)}
                  aria-pressed={type === transactionType}
                  className={`type-option ${type === transactionType ? (transactionType === "IN" ? "type-option--in" : "type-option--out") : ""}`}
                >
                  {transactionType === "IN" ? (
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

            <div className="form-field">
              <label htmlFor="transaction-amount" className="form-label">Nominal</label>
              <div className="relative">
                <span className="input-prefix input-prefix--lg">Rp</span>
                <input
                  id="transaction-amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => {
                    setAmount(formatAmount(e.target.value));
                    setValidationError("");
                  }}
                  className="form-input form-input--amount"
                  autoFocus
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="transaction-description" className="form-label">Deskripsi</label>
              <input
                id="transaction-description"
                type="text"
                placeholder="Contoh: Makan siang, Gaji, dll."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="transaction-category" className="form-label">Kategori</label>
              <select
                id="transaction-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-input"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="transaction-wallet" className="form-label">
                {type === "IN" ? "Ke Dompet" : "Dari Dompet"}
              </label>
              <select
                id="transaction-wallet"
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="form-input"
              >
                <option value="" disabled>Pilih dompet</option>
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
                ))}
              </select>
            </div>

            <div className="form-field form-field--spaced">
              <label htmlFor="transaction-date" className="form-label">Tanggal</label>
              <input
                id="transaction-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
              />
            </div>

            {validationError && <p className="transaction-form-error" role="alert">{validationError}</p>}

            <button type="submit" disabled={!amount || !walletId || submitting} className="btn-primary">
              {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Transaksi"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
