"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { getSupabaseClient } from "@/lib/supabase";
import { AppLayout } from "@/components/layout/AppLayout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "react-toastify";
import { LogOut, Save } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, signOut } = useAppStore();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const currentName = name.trim() || user?.name || "";
  const isDirty = currentName !== (user?.name ?? "");

  const handleSaveName = async () => {
    if (!user || !isDirty) return;
    setSaving(true);
    const { error } = await getSupabaseClient()
      .from("users")
      .update({ name: currentName })
      .eq("id", user.id);
    if (error) {
      toast.error("Gagal menyimpan nama");
      setSaving(false);
      return;
    }
    try {
      await getSupabaseClient().auth.updateUser({ data: { name: currentName } });
    } catch {
      // DB tetap otoritatif; metadata auth hanya bonus
    }
    setUser({ ...user, name: currentName });
    toast.success("Nama berhasil diperbarui");
    setSaving(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <AppLayout>
      <div style={{ padding: "0 0 24px" }}>
        <div style={{ padding: "56px 20px 24px", background: "var(--bg-secondary)" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>Pengaturan</h1>
        </div>

        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Profil */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "16px",
              }}
            >
              Profil
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--green), var(--green-dark))",
                  color: "var(--on-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {(currentName || "U").charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>{currentName || "Pengguna"}</p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{user?.email}</p>
              </div>
            </div>

            <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
              Nama
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu"
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

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginTop: "20px" }}>
              <div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>Bergabung sejak</p>
                <p style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                    : "-"}
                </p>
              </div>
              <button
                onClick={handleSaveName}
                disabled={!isDirty || saving}
                style={{
                  padding: "10px 18px",
                  background: !isDirty || saving ? "var(--border)" : "var(--green)",
                  color: !isDirty || saving ? "var(--text-muted)" : "var(--on-accent)",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: !isDirty || saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Save size={14} />
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>

          {/* Mode Tampilan */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Mode Tampilan</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Pilih tema siang atau malam</p>
            </div>
            <ThemeToggle />
          </div>

          {/* Akun */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "16px",
              }}
            >
              Akun
            </p>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                width: "100%",
                padding: "14px",
                background: "rgba(239,68,68,0.1)",
                color: "var(--red)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "15px",
                cursor: loggingOut ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <LogOut size={16} />
              {loggingOut ? "Keluar..." : "Keluar"}
            </button>
          </div>

          {/* Tentang */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "20px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "12px",
              }}
            >
              Tentang
            </p>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>DuitQu</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Manajemen Keuangan Pribadi v0.1.0</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}