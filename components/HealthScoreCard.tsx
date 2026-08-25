"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bot, ChevronDown, HeartPulse } from "lucide-react";
import { Budget, Transaction, Wallet } from "@/types";
import { calculateHealthScore } from "@/lib/health-score";

const GAUGE_RADIUS = 46;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;
const PENDING_AI_PROMPT_KEY = "duitqu-ai-pending";
const PENDING_AI_PROMPT_TTL_MS = 5 * 60 * 1000;

export function stashPendingAiPrompt(prompt: string) {
  sessionStorage.setItem(
    PENDING_AI_PROMPT_KEY,
    JSON.stringify({ t: Date.now(), p: prompt })
  );
}

export function readPendingAiPrompt(): string | null {
  const raw = sessionStorage.getItem(PENDING_AI_PROMPT_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PENDING_AI_PROMPT_KEY);
  try {
    const { t, p } = JSON.parse(raw) as { t: number; p: string };
    if (!p || Date.now() - t > PENDING_AI_PROMPT_TTL_MS) return null;
    return p;
  } catch {
    return null;
  }
}

export default function HealthScoreCard({
  transactions,
  wallets,
  budgets,
}: {
  transactions: Transaction[];
  wallets: Wallet[];
  budgets: Budget[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  const result = useMemo(
    () => calculateHealthScore(transactions, wallets, budgets),
    [transactions, wallets, budgets]
  );

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const aiPrompt = useMemo(() => {
    if (result.score === null || !result.level) return "";
    const summary = result.factors
      .map((f) =>
        f.score === null
          ? `${f.label}: N/A`
          : `${f.label}: ${Math.round((f.score / f.weight) * 100)}%`
      )
      .join(", ");
    return `Skor kesehatan finansialku bulan ini ${result.score}% (${result.level.label}). Rincian faktor: ${summary}. Beri analisis singkat dan saran konkret untuk memperbaikinya.`;
  }, [result]);

  return (
    <div className="chart-card">
      <div className="chart-head">
        <HeartPulse size={14} color="var(--green)" />
        <p className="chart-title">Kesehatan Finansial</p>
      </div>

      {result.score === null || !result.level ? (
        <div className="health-empty">
          <p className="health-empty-title">Belum cukup data untuk menghitung skor</p>
          <p className="health-empty-desc">
            Catat transaksi dan atur budget agar skormu bisa dihitung.
          </p>
        </div>
      ) : (
        <>
          <div className="health-main">
            <div className="health-gauge" role="img" aria-label={`Skor kesehatan finansial ${result.score}%, ${result.level.label}`}>
              <svg viewBox="0 0 104 104">
                <circle className="health-gauge-track" cx="52" cy="52" r={GAUGE_RADIUS} />
                <circle
                  className="health-gauge-progress"
                  cx="52"
                  cy="52"
                  r={GAUGE_RADIUS}
                  style={{
                    stroke: result.level.color,
                    strokeDasharray: GAUGE_CIRCUMFERENCE,
                    strokeDashoffset: mounted
                      ? GAUGE_CIRCUMFERENCE * (1 - result.score / 100)
                      : GAUGE_CIRCUMFERENCE,
                  }}
                />
              </svg>
              <div className="health-gauge-center">
                <span className="health-score-num">
                  {result.score}
                  <span className="health-score-pct">%</span>
                </span>
              </div>
            </div>
            <div className="health-summary">
              <span className="health-level-badge" style={{ background: result.level.color }}>
                {result.level.label}
              </span>
              <p className="health-level-desc">{result.level.desc}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="chart-toggle"
            aria-expanded={expanded}
          >
            {expanded ? "Sembunyikan detail" : "Lihat detail"}
            <ChevronDown size={14} className={`chart-toggle-icon ${expanded ? "chart-toggle-icon--open" : ""}`} />
          </button>

          {expanded && (
            <div className="health-breakdown">
              {result.factors.map((factor) => {
                const pct =
                  factor.score === null
                    ? null
                    : Math.round((factor.score / factor.weight) * 100);
                const barColor =
                  factor.score === null
                    ? "var(--text-faint)"
                    : pct! >= 80
                      ? "#22c55e"
                      : pct! >= 50
                        ? "#f59e0b"
                        : "#ef4444";
                return (
                  <div
                    key={factor.key}
                    className={`health-factor ${factor.score === null ? "health-factor--na" : ""}`}
                  >
                    <div className="health-factor-row">
                      <span className="health-factor-label">{factor.label}</span>
                      <span className="health-factor-points">
                        {factor.score === null ? "N/A" : `${Math.round(factor.score)}/${factor.weight}`}
                      </span>
                    </div>
                    <div className="health-factor-bar">
                      <div
                        className="health-factor-bar-fill"
                        style={{ width: mounted ? `${pct ?? 0}%` : "0%", background: barColor }}
                      />
                    </div>
                    <p className="health-factor-note">
                      <strong>{factor.detail}.</strong> {factor.tip}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <Link href="/ai-assistant" onClick={() => stashPendingAiPrompt(aiPrompt)} className="health-ai-btn">
            <Bot size={15} />
            Minta Saran AI
          </Link>
        </>
      )}
    </div>
  );
}
