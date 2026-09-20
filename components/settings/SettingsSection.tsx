/**
 * Membungkus kelompok pengaturan dengan heading semantik dan tampilan kartu
 * yang konsisten di halaman profil.
 */
import type { ReactNode } from "react";

export function SettingsSection({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`settings-section ${className}`}>
      <h2 className="settings-section-title">{title}</h2>
      <div className="settings-section-card">{children}</div>
    </section>
  );
}
