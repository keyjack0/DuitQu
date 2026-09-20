"use client";

/**
 * Halaman pusat profil DuitQu untuk mengelola identitas, tema, keamanan,
 * portabilitas data, riwayat AI, informasi aplikasi, dan sesi pengguna.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Download, History, Info, KeyRound, LogOut, Mail, Palette } from "lucide-react";
import { toast } from "react-toastify";
import { useShallow } from "zustand/react/shallow";
import { ChangelogDialog } from "@/components/settings/ChangelogDialog";
import { EditProfileDialog } from "@/components/settings/EditProfileDialog";
import { PasswordDialog } from "@/components/settings/PasswordDialog";
import { ProfileCard } from "@/components/settings/ProfileCard";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { exportUserData } from "@/lib/exportUserData";
import { getSupabaseClient } from "@/lib/supabase";
import { useAppStore } from "@/lib/store";
import { APP_VERSION } from "@/lib/version";

type OpenDialog = "edit-profile" | "password" | "changelog" | null;
type Confirmation = "clear-ai" | "logout" | null;

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, signOut, isLoading } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      setUser: state.setUser,
      signOut: state.signOut,
      isLoading: state.isLoading,
    }))
  );
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [exporting, setExporting] = useState(false);
  const [clearingAI, setClearingAI] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const result = await getSupabaseClient().auth.getUser();
      const authUser = result.data.user as { email_confirmed_at?: string | null } | null;
      if (!cancelled) setEmailVerified(Boolean(authUser?.email_confirmed_at));
    })();
    return () => { cancelled = true; };
  }, [user]);

  async function handleSaveName(name: string) {
    if (!user) return false;
    try {
      const { error } = await getSupabaseClient().from("users").update({ name }).eq("id", user.id);
      if (error) throw error;
      const { error: metadataError } = await getSupabaseClient().auth.updateUser({ data: { name } });
      setUser({ ...user, name });
      if (metadataError) toast.info("Nama tersimpan, tetapi metadata akun belum tersinkron.");
      else toast.success("Profil berhasil diperbarui");
      return true;
    } catch {
      toast.error("Gagal memperbarui profil");
      return false;
    }
  }

  async function handleChangePassword(password: string) {
    try {
      const { error } = await getSupabaseClient().auth.updateUser({ password });
      if (error) throw error;
      toast.success("Kata sandi berhasil diperbarui");
      return true;
    } catch {
      toast.error("Gagal memperbarui kata sandi");
      return false;
    }
  }

  async function handleExport() {
    if (!user || exporting) return;
    setExporting(true);
    try {
      await exportUserData(user);
      toast.success("Data DuitQu berhasil diekspor");
    } catch {
      toast.error("Gagal mengekspor data");
    } finally {
      setExporting(false);
    }
  }

  async function handleClearAIHistory() {
    if (!user || clearingAI) return;
    setClearingAI(true);
    setConfirmation(null);
    try {
      const { error } = await getSupabaseClient().from("ai_chats").delete().eq("user_id", user.id);
      if (error) throw error;
      toast.success("Riwayat AI berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus riwayat AI");
    } finally {
      setClearingAI(false);
    }
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setConfirmation(null);
    const success = await signOut();
    if (!success) {
      toast.error("Gagal keluar dari akun");
      setLoggingOut(false);
      return;
    }
    router.replace("/login");
    router.refresh();
  }

  if (isLoading && !user) {
    return (
      <main className="profile-page">
        <div className="profile-container" role="status" aria-label="Memuat profil">
          <div className="profile-skeleton profile-skeleton--header" />
          <div className="profile-layout">
            <div className="profile-skeleton profile-skeleton--identity" />
            <div className="profile-skeleton-stack">
              <div className="profile-skeleton profile-skeleton--section" />
              <div className="profile-skeleton profile-skeleton--section" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="profile-page">
        <div className="profile-container profile-unavailable" role="alert">
          <h1>Profil belum tersedia</h1>
          <p>Muat ulang halaman atau masuk kembali untuk mengakses pengaturan akun.</p>
          <button type="button" className="btn-primary" onClick={() => router.refresh()}>Muat ulang</button>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <p className="profile-eyebrow">Akun DuitQu</p>
          <h1>Profil</h1>
          <p>Kelola identitas, keamanan, preferensi, dan data keuanganmu.</p>
        </header>

        <div className="profile-layout">
          <aside className="profile-sidebar">
            <ProfileCard user={user} onEdit={() => setOpenDialog("edit-profile")} />
          </aside>

          <div className="profile-settings">
            <SettingsSection title="Preferensi">
              <div className="settings-custom-row">
                <div className="settings-custom-copy">
                  <span className="settings-row-icon"><Palette size={18} aria-hidden="true" /></span>
                  <span><strong>Tampilan</strong><small>Sesuaikan dengan perangkat atau pilih tema.</small></span>
                </div>
                <ThemeSelector />
              </div>
            </SettingsSection>

            <SettingsSection title="Keamanan">
              <SettingsRow
                icon={<Mail size={18} aria-hidden="true" />}
                label="Email akun"
                description={user.email}
                value={<span className={`settings-badge ${emailVerified ? "settings-badge--success" : ""}`}>{emailVerified === null ? "Memeriksa" : emailVerified ? "Terverifikasi" : "Belum terverifikasi"}</span>}
              />
              <SettingsRow
                icon={<KeyRound size={18} aria-hidden="true" />}
                label="Ubah kata sandi"
                description="Gunakan minimal 8 karakter."
                onClick={() => setOpenDialog("password")}
              />
            </SettingsSection>

            <SettingsSection title="Data & Privasi">
              <SettingsRow
                icon={<Download size={18} aria-hidden="true" />}
                label={exporting ? "Menyiapkan ekspor..." : "Ekspor data DuitQu"}
                description="Unduh profil, transaksi, dompet, budget, target, dan chat dalam JSON."
                onClick={() => void handleExport()}
                disabled={exporting}
              />
              <SettingsRow
                icon={<Bot size={18} aria-hidden="true" />}
                label={clearingAI ? "Menghapus riwayat..." : "Hapus riwayat AI"}
                description="Hapus seluruh percakapan dengan DuitQu AI."
                onClick={() => setConfirmation("clear-ai")}
                disabled={clearingAI}
                danger
              />
            </SettingsSection>

            <SettingsSection title="Tentang">
              <SettingsRow
                icon={<Info size={18} aria-hidden="true" />}
                label="DuitQu"
                description="Manajemen keuangan pribadi"
                value={`v${APP_VERSION}`}
              />
              <SettingsRow
                icon={<History size={18} aria-hidden="true" />}
                label="Riwayat pembaruan"
                description="Lihat fitur dan perbaikan terbaru."
                onClick={() => setOpenDialog("changelog")}
              />
            </SettingsSection>

            <SettingsSection title="Sesi Akun" className="settings-section--danger">
              <SettingsRow
                icon={<LogOut size={18} aria-hidden="true" />}
                label={loggingOut ? "Sedang keluar..." : "Keluar dari akun"}
                description="Data akun tetap tersimpan dengan aman."
                onClick={() => setConfirmation("logout")}
                disabled={loggingOut}
                danger
              />
            </SettingsSection>
          </div>
        </div>
      </div>

      {openDialog === "edit-profile" && <EditProfileDialog initialName={user.name} onSave={handleSaveName} onClose={() => setOpenDialog(null)} />}
      {openDialog === "password" && <PasswordDialog onSave={handleChangePassword} onClose={() => setOpenDialog(null)} />}
      {openDialog === "changelog" && <ChangelogDialog onClose={() => setOpenDialog(null)} />}

      {confirmation === "clear-ai" && (
        <ConfirmDialog
          title="Hapus seluruh riwayat AI?"
          description="Semua percakapan AI akan dihapus permanen. Transaksi yang sudah disimpan tidak ikut terhapus."
          confirmLabel="Hapus Riwayat"
          onConfirm={() => void handleClearAIHistory()}
          onCancel={() => setConfirmation(null)}
        />
      )}
      {confirmation === "logout" && (
        <ConfirmDialog
          title="Keluar dari DuitQu?"
          description="Data keuanganmu tetap tersimpan. Kamu perlu masuk kembali untuk mengaksesnya."
          confirmLabel="Keluar"
          onConfirm={() => void handleLogout()}
          onCancel={() => setConfirmation(null)}
        />
      )}
    </main>
  );
}
