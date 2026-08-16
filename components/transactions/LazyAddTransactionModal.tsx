"use client";

import dynamic from "next/dynamic";
import type { AddTransactionModalProps } from "./AddTransactionModal";

function AddTransactionModalFallback() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-end",
        zIndex: 200,
      }}
    >
      <div
        style={{
          width: "100%",
          background: "var(--bg-secondary)",
          borderRadius: "20px 20px 0 0",
          border: "1px solid var(--border)",
          borderBottom: "none",
          padding: "24px 20px 40px",
        }}
      >
        <div
          style={{
            width: "42%",
            height: "18px",
            borderRadius: "6px",
            background: "var(--bg-hover)",
            marginBottom: "24px",
          }}
        />
        {[52, 44, 44, 44, 44].map((height, index) => (
          <div
            key={index}
            style={{
              height,
              borderRadius: "8px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              marginBottom: "14px",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export const LazyAddTransactionModal = dynamic<AddTransactionModalProps>(
  () => import("./AddTransactionModal").then((mod) => mod.AddTransactionModal),
  {
    loading: AddTransactionModalFallback,
  }
);
