"use client";

/** Menampilkan dan mengelola dompet, saldo, rincian, serta transfer antar dompet. */
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeftRight,
  ChevronDown,
  Edit3,
  Plus,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { WalletIcon, WALLET_ICON_OPTIONS, WALLET_COLORS } from "@/lib/icons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import { LazyTransferModal } from "@/components/wallets/LazyTransferModal";
import { WalletDetail } from "@/components/wallets/WalletDetail";
import type { Wallet } from "@/types";
import { useShallow } from "zustand/react/shallow";

const FALLBACK_WALLET_COLOR = "#64748b";

export default function WalletsPage() {
  const { user, wallets, addWallet, updateWallet, deleteWallet } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      wallets: state.wallets,
      addWallet: state.addWallet,
      updateWallet: state.updateWallet,
      deleteWallet: state.deleteWallet,
    }))
  );
  const [showAdd, setShowAdd] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [expandedWalletId, setExpandedWalletId] = useState<string | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [icon, setIcon] = useState("cash");

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const positiveBalanceTotal = wallets.reduce(
    (sum, wallet) => sum + Math.max(wallet.balance, 0),
    0
  );
  const largestWallet = wallets.reduce<Wallet | null>(
    (largest, wallet) => !largest || wallet.balance > largest.balance ? wallet : largest,
    null
  );
  const canSave = name.trim().length > 0 && (!!editingWallet || !!user);

  const walletColor = (wallet: Wallet) =>
    wallet.color || WALLET_COLORS[wallet.icon ?? ""] || FALLBACK_WALLET_COLOR;

  const walletShare = (wallet: Wallet) =>
    positiveBalanceTotal > 0 && wallet.balance > 0
      ? (wallet.balance / positiveBalanceTotal) * 100
      : 0;

  const shareLabel = (share: number) => {
    if (share > 0 && share < 1) return "<1%";
    return `${Math.round(share)}%`;
  };

  const formatAmount = (value: string) => {
    const isNegative = value.trim().startsWith("-");
    const numericValue = value.replace(/\D/g, "");
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return isNegative && formattedValue ? `-${formattedValue}` : formattedValue;
  };

  const closeAdd = () => {
    setShowAdd(false);
    setEditingWallet(null);
    setName("");
    setBalance("");
    setIcon("cash");
  };

  const openAdd = () => {
    closeAdd();
    setOpenRowId(null);
    setShowAdd(true);
  };

  const openEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setName(wallet.name);
    setBalance(formatAmount(wallet.balance.toString()));
    setIcon(wallet.icon || "cash");
    setOpenRowId(null);
    setShowAdd(true);
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const parsedBalance = Number(balance.replace(/\./g, "") || "0");
    if (!Number.isFinite(parsedBalance)) return;

    if (editingWallet) {
      updateWallet(editingWallet.id, { name: trimmedName, balance: parsedBalance, icon });
    } else {
      if (!user) return;
      addWallet({
        id: crypto.randomUUID(),
        user_id: user.id,
        name: trimmedName,
        balance: parsedBalance,
        icon,
        color: null,
        created_at: new Date().toISOString(),
      });
    }

    closeAdd();
  };

  const toggleWalletDetail = (walletId: string) => {
    setOpenRowId(null);
    setExpandedWalletId((current) => current === walletId ? null : walletId);
  };

  return (
    <>
      <div className="page-shell wallets-page">
        <header className="wallet-page-header">
          <div>
            <h1 className="page-title">Dompet</h1>
            <p className="wallet-page-subtitle">
              Pantau saldo dan perpindahan uangmu dalam satu tempat.
            </p>
          </div>
        </header>

        <div className="wallet-page-grid">
          <div className="wallet-overview-column">
            <section className="wallet-total-card" aria-labelledby="wallet-total-title">
              <div className="wallet-total-head">
                <div>
                  <p id="wallet-total-title" className="total-label">Total Saldo</p>
                  <p className="total-value">{formatCurrency(totalBalance)}</p>
                </div>
              </div>

              <div className="wallet-total-stats">
                <div>
                  <span>Dompet aktif</span>
                  <strong>{wallets.length}</strong>
                </div>
                <div>
                  <span>Saldo terbesar</span>
                  <strong>{largestWallet?.name || "Belum ada"}</strong>
                </div>
              </div>

              <div className="wallet-quick-actions">
                <button
                  type="button"
                  className="wallet-action wallet-action--secondary"
                  onClick={() => setShowTransfer(true)}
                  disabled={wallets.length < 2}
                  title={wallets.length < 2 ? "Butuh minimal 2 dompet" : "Transfer antar dompet"}
                >
                  <ArrowLeftRight size={17} />
                  Transfer
                </button>
                <button
                  type="button"
                  className="wallet-action wallet-action--primary"
                  onClick={openAdd}
                  disabled={!user}
                >
                  <Plus size={18} />
                  Tambah Dompet
                </button>
              </div>
            </section>

            {wallets.length > 0 && (
              <section className="wallet-distribution-card" aria-labelledby="distribution-title">
                <div className="wallet-section-head">
                  <div>
                    <h2 id="distribution-title" className="wallet-section-title">Distribusi</h2>
                  </div>
                  {/* <span className="wallet-section-count">{wallets.length} dompet</span> */}
                </div>

                {positiveBalanceTotal > 0 ? (
                  <div
                    className="dist-bar"
                    role="img"
                    aria-label="Distribusi saldo positif antar dompet"
                  >
                    {wallets.filter((wallet) => wallet.balance > 0).map((wallet) => (
                      <div
                        key={wallet.id}
                        className="dist-seg"
                        style={{
                          width: `${walletShare(wallet)}%`,
                          backgroundColor: walletColor(wallet),
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="dist-empty">Belum ada saldo positif untuk ditampilkan.</p>
                )}

                <div className="dist-legend">
                  {wallets.map((wallet) => {
                    const share = walletShare(wallet);
                    return (
                      <div key={wallet.id} className="legend-item">
                        <span
                          className="legend-dot"
                          style={{ backgroundColor: walletColor(wallet) }}
                        />
                        <div className="legend-copy">
                          <span className="legend-name">{wallet.name}</span>
                          <span className="legend-value">{formatCurrency(wallet.balance)}</span>
                        </div>
                        <span className="legend-percent">{shareLabel(share)}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <section className="wallet-list-section" aria-labelledby="wallet-list-title">
            <div className="wallet-section-head">
              <div>
                <h2 id="wallet-list-title" className="wallet-section-title">Daftar Dompet</h2>
              </div>
              {/* {wallets.length > 0 && (
                <span className="wallet-section-count">{wallets.length} total</span>
              )} */}
            </div>

            {wallets.length === 0 ? (
              <div className="wallet-empty-state">
                <div className="wallet-empty-icon"><WalletCards size={28} /></div>
                <h3>Belum ada dompet</h3>
                <p>Tambahkan dompet pertama untuk mulai mencatat saldo dan transaksi.</p>
                <button type="button" className="btn-primary btn-primary--sm" onClick={openAdd} disabled={!user}>
                  <Plus size={17} />
                  Tambah Dompet Pertama
                </button>
              </div>
            ) : (
              <>
                <div className="wallet-list">
                  {wallets.map((wallet) => {
                    const isExpanded = expandedWalletId === wallet.id;
                    const share = walletShare(wallet);
                    const color = walletColor(wallet);
                    const panelId = `wallet-detail-${wallet.id}`;

                    return (
                      <div key={wallet.id} className="wallet-list-item">
                        <SwipeableRow
                          isOpen={openRowId === wallet.id}
                          onOpenChange={(open) => setOpenRowId(open ? wallet.id : null)}
                          actions={
                            <>
                              <button
                                type="button"
                                onClick={() => openEdit(wallet)}
                                aria-label={`Edit ${wallet.name}`}
                                title={`Edit ${wallet.name}`}
                                style={{ background: "var(--bg-hover)", color: "var(--text-primary)" }}
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenRowId(null);
                                  setConfirmDeleteId(wallet.id);
                                }}
                                aria-label={`Hapus ${wallet.name}`}
                                title={`Hapus ${wallet.name}`}
                                style={{ background: "var(--red)", color: "#fff" }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          }
                        >
                          <div className="wallet-row-content">
                            <div
                              className="wallet-icon-box"
                              style={{ backgroundColor: `${color}1f` }}
                            >
                              <WalletIcon icon={wallet.icon} color={color} />
                            </div>
                            <div className="wallet-info">
                              <p className="wallet-name">{wallet.name}</p>
                              <p className="wallet-share">{shareLabel(share)} dari saldo positif</p>
                            </div>
                            <div className="wallet-row-end">
                              <p className={`wallet-balance ${wallet.balance < 0 ? "wallet-balance--negative" : ""}`}>
                                {formatCurrency(wallet.balance)}
                              </p>
                              <button
                                type="button"
                                className={`wallet-detail-toggle ${isExpanded ? "wallet-detail-toggle--open" : ""}`}
                                onClick={() => toggleWalletDetail(wallet.id)}
                                aria-expanded={isExpanded}
                                aria-controls={panelId}
                                aria-label={`${isExpanded ? "Tutup" : "Buka"} detail ${wallet.name}`}
                              >
                                <ChevronDown size={16} />
                              </button>
                            </div>
                          </div>
                        </SwipeableRow>

                        {isExpanded && (
                          <div id={panelId} className="wallet-detail-panel">
                            <WalletDetail walletId={wallet.id} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {showAdd && (
        <div
          className="sheet-overlay wallet-sheet-overlay"
          onClick={(event) => event.target === event.currentTarget && closeAdd()}
          role="presentation"
        >
          <div
            className="sheet-panel sheet-panel--rise wallet-sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-form-title"
          >
            <div className="sheet-head">
              <h2 id="wallet-form-title" className="sheet-title">
                {editingWallet ? "Edit Dompet" : "Tambah Dompet"}
              </h2>
              <button type="button" onClick={closeAdd} className="sheet-close" aria-label="Tutup form">
                <X size={16} />
              </button>
            </div>

            <div className="form-field">
              <label htmlFor="wallet-name" className="form-label">Nama Dompet</label>
              <input
                id="wallet-name"
                placeholder="Contoh: BCA Tabungan, GoPay"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="form-input"
                autoFocus
              />
            </div>

            <div className="form-field">
              <label htmlFor="wallet-balance" className="form-label">
                {editingWallet ? "Saldo Saat Ini" : "Saldo Awal"}
              </label>
              <div className="relative">
                <span className="input-prefix">Rp</span>
                <input
                  id="wallet-balance"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={balance}
                  onChange={(event) => setBalance(formatAmount(event.target.value))}
                  className="form-input form-input--prefix"
                />
              </div>
            </div>

            <fieldset className="form-field form-field--spaced wallet-icon-fieldset">
              <legend className="form-label form-label--roomy">Ikon</legend>
              <div className="icon-picker">
                {WALLET_ICON_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setIcon(option.key)}
                    className={`icon-option ${icon === option.key ? "icon-option--active" : ""}`}
                    aria-label={option.label}
                    aria-pressed={icon === option.key}
                    title={option.label}
                  >
                    <option.icon size={18} />
                  </button>
                ))}
              </div>
            </fieldset>

            <button type="button" onClick={handleSave} className="btn-primary" disabled={!canSave}>
              {editingWallet ? "Simpan Perubahan" : "Simpan Dompet"}
            </button>
          </div>
        </div>
      )}

      {showTransfer && <LazyTransferModal onClose={() => setShowTransfer(false)} />}

      {confirmDeleteId && (
        <ConfirmDialog
          title="Hapus dompet ini?"
          description="Dompet akan dihapus. Riwayat transaksi tetap tersimpan, tetapi tidak lagi terhubung ke dompet ini."
          onConfirm={() => {
            deleteWallet(confirmDeleteId);
            setExpandedWalletId((current) => current === confirmDeleteId ? null : current);
            setConfirmDeleteId(null);
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </>
  );
}
