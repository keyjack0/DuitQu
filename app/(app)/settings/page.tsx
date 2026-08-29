"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { getSupabaseClient } from "@/lib/supabase";
import { ThemeToggle } from "@/components/ThemeToggle";
import { APP_VERSION, CHANGELOG_HISTORY } from "@/lib/version";
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
    // router.refresh();
  };

  return (
    <div className="page-shell">
      <div className="page-hero pb-6">
        <h1 className="page-title">Pengaturan</h1>
      </div>

      <div className="settings-list">
        {/* Profil */}
        <div className="card">
          <p className="section-label mb-4">Profil</p>

          <div className="profile-row">
            <div className="avatar-circle">{(currentName || "U").charAt(0)}</div>
            <div className="profile-info">
              <p className="profile-name">{currentName || "Pengguna"}</p>
              <p className="profile-email">{user?.email}</p>
            </div>
          </div>

          <label className="form-label">Nama</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            className="form-input"
          />

          <div className="profile-footer">
            <div>
              <p className="meta-label">Bergabung sejak</p>
              <p className="meta-value">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                  : "-"}
              </p>
            </div>
            <button
              onClick={handleSaveName}
              disabled={!isDirty || saving}
              className="btn-primary btn-primary--sm"
            >
              <Save size={14} />
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>

        {/* Mode Tampilan */}
        <div className="card card--row">
          <div>
            <p className="text-sm font-semibold text-fg">Mode Tampilan</p>
            <p className="text-xs text-muted">Pilih tema siang atau malam</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Akun */}
        <div className="card">
          <p className="section-label mb-4">Akun</p>
          <button onClick={handleLogout} disabled={loggingOut} className="btn-danger-outline">
            <LogOut size={16} />
            {loggingOut ? "Keluar..." : "Keluar"}
          </button>
        </div>

        {/* Tentang */}
        <div className="card">
          <p className="section-label mb-3">Tentang</p>
          <p className="about-title">DuitQu</p>
          <p className="about-desc">Manajemen Keuangan Pribadi v{APP_VERSION}</p>
        </div>

        {/* Riwayat Update */}
        <div className="card">
          <p className="section-label mb-3">Riwayat Update</p>
          {CHANGELOG_HISTORY.map((entry) => (
            <div key={entry.version} className="changelog-entry">
              <div className="changelog-header">
                <span className="changelog-version">v{entry.version}</span>
                <span className="changelog-date">{entry.date}</span>
              </div>
              <ul className="changelog-notes">
                {entry.notes.map((note, i) => (
                  <li key={i}>• {note}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
