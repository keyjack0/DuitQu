"use client";

/**
 * Menampilkan riwayat rilis DuitQu dalam dialog agar informasi produk tidak
 * mendominasi tugas utama pada halaman profil.
 */
import { FinanceDialog } from "@/components/finance/FinanceDialog";
import { CHANGELOG_HISTORY } from "@/lib/version";

export function ChangelogDialog({ onClose }: { onClose: () => void }) {
  return (
    <FinanceDialog title="Riwayat pembaruan" onClose={onClose}>
      <div className="settings-changelog">
        {CHANGELOG_HISTORY.map((entry) => (
          <section key={entry.version} className="changelog-entry">
            <div className="changelog-header">
              <span className="changelog-version">v{entry.version}</span>
              <time className="changelog-date" dateTime={entry.date}>
                {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${entry.date}T00:00:00`))}
              </time>
            </div>
            <ul className="changelog-notes">
              {entry.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </FinanceDialog>
  );
}
