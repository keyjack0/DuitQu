"use client";

/** Menampilkan sambutan, kondisi keuangan, dan saran tindakan asisten. */
import Link from "next/link";
import { ArrowRight, Bot, MessageCircleMore, Sparkles } from "lucide-react";
import type { AssistantAction } from "@/types";
import type { AssistantSnapshot } from "@/lib/aiAssistant";
import { FinancialSnapshot } from "./FinancialSnapshot";

interface Props {
  name?: string;
  snapshot: AssistantSnapshot;
  actions: AssistantAction[];
  onPrompt: (prompt: string) => void;
  compact?: boolean;
}

export function AssistantWelcome({ name, snapshot, actions, onPrompt, compact = false }: Props) {
  return (
    <div className={`ai-welcome ${compact ? "ai-welcome--compact" : ""}`}>
      {!compact && (
        <section className="ai-welcome-hero">
          <span className="ai-welcome-icon"><Bot size={22} aria-hidden="true" /></span>
          <div>
            <p className="ai-eyebrow"><Sparkles size={12} aria-hidden="true" /> Financial copilot</p>
            <h2>Halo{name ? `, ${name.split(" ")[0]}` : ""}. Mau mulai dari mana?</h2>
            <p>Aku bisa membantu mencatat transaksi dan membaca kondisi keuanganmu.</p>
          </div>
        </section>
      )}

      <FinancialSnapshot snapshot={snapshot} />

      <section className="ai-actions" aria-labelledby={compact ? "ai-actions-sidebar" : "ai-actions-welcome"}>
        <div className="ai-actions-title-row">
          <MessageCircleMore size={16} aria-hidden="true" />
          <h2 id={compact ? "ai-actions-sidebar" : "ai-actions-welcome"}>Coba tanyakan</h2>
        </div>
        <div className="ai-action-grid">
          {actions.map((action) => action.kind === "link" ? (
            <Link key={`${action.kind}-${action.label}`} href={action.href} className="ai-action-card">
              <span>{action.label}</span><ArrowRight size={15} aria-hidden="true" />
            </Link>
          ) : (
            <button
              key={`${action.kind}-${action.label}`}
              type="button"
              className="ai-action-card"
              onClick={() => onPrompt(action.prompt)}
            >
              <span>{action.label}</span><ArrowRight size={15} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
