/** Menyediakan kerangka pemuatan untuk dashboard dan kartu grafiknya. */
export function ChartSkeleton() {
  return (
    <section className="chart-card dashboard-chart-skeleton" aria-hidden="true">
      <div className="dashboard-skeleton-line dashboard-skeleton-line--chart-title" />
      <div className="dashboard-skeleton-chart">
        {[42, 68, 52, 86, 60, 74, 48].map((height, index) => (
          <span key={index} style={{ height: `${height}%` }} />
        ))}
      </div>
    </section>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="dashboard dashboard-skeleton" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Memuat dashboard...</span>
      <div className="dashboard-hero">
        <div className="dashboard-container">
          <div className="dashboard-skeleton-topbar">
            <div>
              <div className="dashboard-skeleton-line dashboard-skeleton-line--greeting" />
              <div className="dashboard-skeleton-line dashboard-skeleton-line--title" />
            </div>
            <div className="dashboard-skeleton-circle" />
          </div>
          <div className="dashboard-skeleton-balance">
            <div className="dashboard-skeleton-line dashboard-skeleton-line--balance-label" />
            <div className="dashboard-skeleton-line dashboard-skeleton-line--balance" />
          </div>
        </div>
      </div>
      <div className="dashboard-container dashboard-content">
        <div className="dashboard-column">
          <div className="dashboard-skeleton-actions">
            <span />
            <span />
          </div>
          <ChartSkeleton />
          <ChartSkeleton />
          {[0, 1, 2].map((item) => (
            <div key={item} className="dashboard-skeleton-row">
              <div className="dashboard-skeleton-square" />
              <div className="dashboard-skeleton-row-copy">
                <div className="dashboard-skeleton-line dashboard-skeleton-line--row-main" />
                <div className="dashboard-skeleton-line dashboard-skeleton-line--row-sub" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
