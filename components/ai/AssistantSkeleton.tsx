/** Menampilkan kerangka pemuatan untuk halaman asisten keuangan. */
export function AssistantSkeleton() {
  return (
    <div className="ai-skeleton" role="status" aria-label="Memuat DuitQu AI">
      <div className="ai-skeleton-card ai-skeleton-card--hero" />
      <div className="ai-skeleton-grid">
        <div className="ai-skeleton-card" />
        <div className="ai-skeleton-card" />
      </div>
      <div className="ai-skeleton-card ai-skeleton-card--line" />
      <span className="sr-only">Memuat data keuangan dan riwayat chat...</span>
    </div>
  );
}
