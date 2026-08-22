"use client";

import dynamic from "next/dynamic";
import type { AddTransactionModalProps } from "./AddTransactionModal";

function AddTransactionModalFallback() {
  return (
    <div className="sheet-overlay">
      <div className="sheet-panel">
        <div className="sk-sheet-title" />
        {[52, 44, 44, 44, 44].map((height, index) => (
          <div
            key={index}
            className="sk-sheet-row"
            style={{ height }}
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
