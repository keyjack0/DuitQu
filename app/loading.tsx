export default function Loading() {
  return (
    <div className="sk-shell">
      <aside className="sk-sidebar" aria-hidden="true">
        <div className="sk-sidebar-brand">
          <div className="sk-sidebar-logo" />
          <div className="sk-sidebar-brand-lines">
            <div className="sk-sidebar-brand-title" />
            <div className="sk-sidebar-brand-caption" />
          </div>
        </div>
        {[0, 1, 2].map((group) => (
          <div className="sk-sidebar-group" key={group}>
            <div className="sk-sidebar-label" />
            <div className="sk-sidebar-link" />
            <div className="sk-sidebar-link" />
            <div className="sk-sidebar-link" />
          </div>
        ))}
      </aside>

      <main className="sk-page" aria-busy="true" aria-label="Memuat halaman">
        <div className="sk-wrap">
          <div className="sk-top">
            <div>
              <div className="sk-pill-sm" />
              <div className="sk-title" />
            </div>
            <div className="sk-avatar" />
          </div>

          <div className="sk-content-grid">
            <div className="sk-hero">
              <div className="sk-hero-label" />
              <div className="sk-hero-amount" />
              <div className="sk-hero-stats">
                <div className="sk-stat" />
                <div className="sk-stat" />
              </div>
            </div>

            <div className="sk-rows">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="sk-row">
                  <div className="sk-thumb" />
                  <div className="sk-row-lines">
                    <div className="sk-line-a" />
                    <div className="sk-line-b" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
