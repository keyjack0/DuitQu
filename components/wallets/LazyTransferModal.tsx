"use client";

/** Memuat dialog transfer secara dinamis dengan kerangka sementara. */
import dynamic from "next/dynamic";
import type { TransferModalProps } from "./TransferModal";

export const LazyTransferModal = dynamic<TransferModalProps>(
  () => import("./TransferModal").then((module) => module.TransferModal),
  {
    loading: () => (
      <div className="sheet-overlay">
        <div className="sheet-panel">
          <div className="sk-sheet-title" />
          {[44, 44, 52, 44].map((height, index) => (
            <div key={index} className="sk-sheet-row" style={{ height }} />
          ))}
        </div>
      </div>
    ),
  }
);
