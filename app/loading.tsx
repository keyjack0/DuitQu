export default function Loading() {
  return (
    <main className="sk-page">
      <div className="sk-wrap">
        <div className="sk-top">
          <div>
            <div className="sk-pill-sm" />
            <div className="sk-title" />
          </div>
          <div className="sk-avatar" />
        </div>

        <div className="sk-hero">
          <div className="sk-hero-label" />
          <div className="sk-hero-amount" />
          <div className="sk-hero-stats">
            <div className="sk-stat" />
            <div className="sk-stat" />
          </div>
        </div>

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
    </main>
  );
}
