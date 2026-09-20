"use client";

/** Memuat dialog transaksi secara dinamis dengan kerangka sementara. */
import dynamic from "next/dynamic";
import type { AddTransactionModalProps } from "./AddTransactionModal";

function AddTransactionModalFallback() {
  return (
    <div className="sheet-overlay transaction-sheet-overlay" role="status" aria-label="Memuat form transaksi">
      <div className="sheet-panel transaction-sheet-panel" aria-hidden="true">
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
