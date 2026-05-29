"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { WalletIcon, WALLET_ICON_OPTIONS } from "@/lib/icons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function WalletsPage() {
  const { user, wallets, addWallet, updateWallet, deleteWallet } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [icon, setIcon] = useState("cash");

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const formatAmount = (val: string) => {
    const num = val.replace(/\D/g, "");
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleAdd = () => {
    if (!name) return;
    const parsedBalance = parseFloat(balance.replace(/\./g, "") || "0");
    addWallet({
      id: crypto.randomUUID(),
      user_id: user!.id,
      name,
      balance: parsedBalance,
      icon,
      color: null,
      created_at: new Date().toISOString(),
    });
    setName("");
    setBalance("");
    setIcon("cash");
    setShowAdd(false);
  };

  return (
    <AppLayout>
      <div style={{ padding: "0 0 24px" }}>
        <div style={{ padding: "56px 20px 24px", background: "#111111" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#f5f5f5" }}>Dompet</h1>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#22c55e",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Plus size={18} color="#000" strokeWidth={2.5} />
            </button>
          </div>

          {/* Total */}
          <div
            style={{
              background: "linear-gradient(135deg, #161616, #1a1a1a)",
              border: "1px solid #2a2a2a",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 4px 20px rgba(34, 197, 94, 0.08)",
            }}
          >
            <p style={{ fontSize: "12px", color: "#666666", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>Total Saldo</p>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "#f5f5f5" }}>{formatCurrency(totalBalance)}</p>
            <p style={{ fontSize: "12px", color: "#666666", marginTop: "6px" }}>{wallets.length} dompet aktif</p>
          </div>
        </div>

        <div style={{ padding: "0 20px" }}>
          {/* Wallet distribution bar */}
          {wallets.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: "12px", color: "#666666", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
                Distribusi
              </p>
              <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", height: "6px", gap: "2px" }}>
                {wallets.map((w, i) => (
                  <div
                    key={w.id}
                    style={{
                      flex: w.balance / totalBalance,
                      background: i === 0 ? "#22c55e" : i === 1 ? "#a3a3a3" : "#525252",
                      borderRadius: "3px",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                {wallets.map((w, i) => (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: i === 0 ? "#22c55e" : i === 1 ? "#a3a3a3" : "#525252" }} />
                    <span style={{ fontSize: "11px", color: "#666666" }}>{w.name} ({Math.round((w.balance / totalBalance) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wallet list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                style={{
                  background: "#161616",
                  border: "1px solid #2a2a2a",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "rgba(34, 197, 94, 0.08)",
                    border: "1px solid rgba(34, 197, 94, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <WalletIcon icon={wallet.icon} size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#f5f5f5", marginBottom: "2px" }}>{wallet.name}</p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#22c55e" }}>{formatCurrency(wallet.balance)}</p>
                </div>
                <button
                  onClick={() => setConfirmDeleteId(wallet.id)}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "transparent",
                    border: "1px solid #2a2a2a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#444444",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Wallet Modal */}
      {showAdd && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "flex-end",
            zIndex: 200,
          }}
          onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
        >
          <div style={{ width: "100%", background: "#111111", borderRadius: "20px 20px 0 0", border: "1px solid #2a2a2a", padding: "24px 20px 40px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#f5f5f5", marginBottom: "20px" }}>Tambah Dompet</h2>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#666666", marginBottom: "6px" }}>Nama Dompet</label>
              <input
                placeholder="Contoh: BCA Tabungan, GoPay"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", background: "#161616", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "10px 14px", color: "#f5f5f5", fontSize: "14px", outline: "none" }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#666666", marginBottom: "6px" }}>Saldo Awal</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#666666", fontSize: "13px" }}>Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={balance}
                  onChange={(e) => setBalance(formatAmount(e.target.value))}
                  style={{ width: "100%", background: "#161616", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "10px 14px 10px 38px", color: "#f5f5f5", fontSize: "14px", outline: "none" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#666666", marginBottom: "8px" }}>Ikon</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {WALLET_ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setIcon(opt.key)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid",
                      borderColor: icon === opt.key ? "#22c55e" : "#2a2a2a",
                      background: icon === opt.key ? "rgba(34,197,94,0.12)" : "#161616",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <opt.icon size={18} />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAdd}
              style={{ width: "100%", padding: "14px", background: "#22c55e", color: "#000", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}
            >
              Simpan Dompet
            </button>
          </div>
        </div>
      )}

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
    </AppLayout>
  );
}
