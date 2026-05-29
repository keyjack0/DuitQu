"use client";

interface Props {
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, description, onConfirm, onCancel }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        animation: "fadeIn 0.2s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        style={{
          background: "#111111",
          border: "1px solid #2a2a2a",
          borderRadius: "16px",
          padding: "24px",
          width: "300px",
          textAlign: "center",
          animation: "slideUp 0.2s ease",
        }}
      >
        <p style={{ fontSize: "16px", fontWeight: 700, color: "#f5f5f5", marginBottom: "8px" }}>
          {title}
        </p>
        {description && (
          <p style={{ fontSize: "13px", color: "#666666", marginBottom: "20px" }}>
            {description}
          </p>
        )}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #2a2a2a",
              background: "transparent",
              color: "#a0a0a0",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: "#ef4444",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
