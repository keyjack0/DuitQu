"use client";

/**
 * Menyusun shell halaman terautentikasi, inisialisasi data, navigasi utama,
 * dialog rilis, dan notifikasi yang mengikuti tema aktif.
 */

import { BottomNav } from "./BottomNav";
import { DataInitializer } from "../DataInitializer";
import { WhatsNewDialog } from "../WhatsNewDialog";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useThemePreference } from "../ThemeToggle";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useThemePreference();
  return (
    <div className="app-shell">
      <DataInitializer />
      <main>{children}</main>
      <WhatsNewDialog />
      <BottomNav />
      <ToastContainer position="top-center" autoClose={2500} theme={theme} hideProgressBar />
    </div>
  );
}
