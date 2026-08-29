"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Edit3, ArrowLeftRight } from "lucide-react";
import { WalletIcon, WALLET_ICON_OPTIONS, WALLET_COLORS } from "@/lib/icons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import { TransferModal } from "@/components/wallets/TransferModal";
import type { Wallet } from "@/types";

export default function WalletsPage() {
  const { user, wallets, addWallet, updateWallet, deleteWallet } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [icon, setIcon] = useState("cash");

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const formatAmount = (val: string) => {
    const num = val.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const closeAdd = () => {
    setShowAdd(false);
    setEditingWallet(null);
    setName("");
    setBalance("");
    setIcon("cash");
  };

  const openEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setName(wallet.name);
    setBalance(formatAmount(wallet.balance.toString()));
    setIcon(wallet.icon || "cash");
    setShowAdd(true);
  };

  const handleAdd = () => {
    if (!name) return;
    const parsedBalance = parseFloat(balance.replace(/\./g, "") || "0");
    if (editingWallet) {
      updateWallet(editingWallet.id, { name, balance: parsedBalance, icon });
    } else {
      addWallet({
        id: crypto.randomUUID(),
        user_id: user!.id,
        name,
        balance: parsedBalance,
        icon,
        color: null,
        created_at: new Date().toISOString(),
      });
    }
    setName("");
    setBalance("");
    setIcon("cash");
    setEditingWallet(null);
    setShowAdd(false);
  };

  return (
    <>
      <div className="page-shell">
        <div className="page-hero pb-6">
          <div className="page-title-row mb-5">
            <h1 className="page-title">Dompet</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTransfer(true)}
                title="Transfer antar dompet"
                className="icon-btn-square icon-btn-square--ghost"
              >
                <ArrowLeftRight size={18} color="var(--text-secondary)" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="icon-btn-square icon-btn-square--primary"
              >
                <Plus size={18} color="var(--on-accent)" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="wallet-total-card">
            <p className="total-label">Total Saldo</p>
            <p className="total-value">{formatCurrency(totalBalance)}</p>
            <p className="total-sub">{wallets.length} dompet aktif</p>
          </div>
        </div>

        <div className="page-body">
          {/* Wallet distribution bar */}
          {wallets.length > 0 && (
            <div className="dist-wrap">
              <p className="section-label mb-2.5">
                Distribusi
              </p>
              <div className="dist-bar">
                {wallets.map((w, i) => (
                  <div
                    key={w.id}
                    className={`dist-seg ${i === 0 ? "dist-seg--c0" : i === 1 ? "dist-seg--c1" : "dist-seg--c2"}`}
                    style={{ flex: totalBalance > 0 ? w.balance / totalBalance : 0 }}
                  />
                ))}
              </div>
              <div className="dist-legend">
                {wallets.map((w, i) => (
                  <div key={w.id} className="legend-item">
                    <div className={`legend-dot ${i === 0 ? "dist-seg--c0" : i === 1 ? "dist-seg--c1" : "dist-seg--c2"}`} />
                    <span className="legend-text">{w.name} ({totalBalance > 0 ? Math.round((w.balance / totalBalance) * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wallet list */}
          <div className="wallet-list">
            {wallets.map((wallet) => (
              <SwipeableRow
                key={wallet.id}
                isOpen={openRowId === wallet.id}
                onOpenChange={(open) => setOpenRowId(open ? wallet.id : null)}
                actions={
                  <>
                    <button
                      onClick={() => openEdit(wallet)}
                      aria-label="Edit dompet"
                      style={{ background: "var(--bg-hover)", color: "var(--text-primary)" }}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(wallet.id)}
                      aria-label="Hapus dompet"
                      style={{ background: "var(--red)", color: "#fff" }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                }
              >
                <div className="wallet-row-content">
                  <div className="wallet-icon-box"
                    style={{ backgroundColor: `${WALLET_COLORS[wallet.icon ?? ""] || "var(--text-muted)"}1f` }}>
                    <WalletIcon icon={wallet.icon} size={20} color={WALLET_COLORS[wallet.icon ?? ""] || "var(--text-muted)"} />
                  </div>
                  <div className="wallet-info">
                    <p className="wallet-name">{wallet.name}</p>
                    </div>
                    <p className="wallet-balance">{formatCurrency(wallet.balance)}</p>
                  
                </div>
              </SwipeableRow>
            ))}
          </div>
        </div>
      </div>

      {/* Add Wallet Modal */}
      {showAdd && (
        <div
          className="sheet-overlay"
          onClick={(e) => e.target === e.currentTarget && closeAdd()}
        >
          <div className="sheet-panel">
            <h2 className="sheet-title mb-5">{editingWallet ? "Edit Dompet" : "Tambah Dompet"}</h2>

            <div className="form-field">
              <label className="form-label">Nama Dompet</label>
              <input
                placeholder="Contoh: BCA Tabungan, GoPay"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">{editingWallet ? "Saldo Saat Ini" : "Saldo Awal"}</label>
              <div className="relative">
                <span className="input-prefix">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={balance}
                  onChange={(e) => setBalance(formatAmount(e.target.value))}
                  className="form-input form-input--prefix"
                />
              </div>
            </div>

            <div className="form-field mb-5">
              <label className="form-label form-label--roomy">Ikon</label>
              <div className="icon-picker">
                {WALLET_ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setIcon(opt.key)}
                    className={`icon-option ${icon === opt.key ? "icon-option--active" : ""}`}
                  >
                    <opt.icon size={18} />
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleAdd} className="btn-primary">
              {editingWallet ? "Simpan Perubahan" : "Simpan Dompet"}
            </button>
          </div>
        </div>
      )}

      {showTransfer && <TransferModal onClose={() => setShowTransfer(false)} />}

      {confirmDeleteId && (
        <ConfirmDialog
          title="Hapus dompet ini?"
          description="Semua data transaksi di dompet ini juga akan terhapus."
          onConfirm={() => {
            deleteWallet(confirmDeleteId);
            setConfirmDeleteId(null);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </>
  );
}
