"use client";

/** Merender pesan percakapan AI beserta draf transaksi yang terdeteksi. */
import { Bot, User } from "lucide-react";
import type { AIMessage } from "@/types";
import MarkdownText from "./MarkdownText";
import { TransactionDraftCard } from "./TransactionDraftCard";

interface Props {
  message: AIMessage;
  onReviewTransaction: (message: AIMessage) => void;
}

export function AssistantMessage({ message, onReviewTransaction }: Props) {
  const isUser = message.role === "user";
  return (
    <article className={`ai-msg ${isUser ? "ai-msg--user" : ""}`}>
      {!isUser && (
        <div className="ai-avatar ai-avatar--bot"><Bot size={14} aria-hidden="true" /></div>
      )}
      <div className={`ai-bubble-wrap ${isUser ? "ai-bubble-wrap--user" : ""}`}>
        {message.content && (
          <div className={`ai-bubble ${isUser ? "ai-bubble--user" : "ai-bubble--bot"}`}>
            {isUser ? message.content : <MarkdownText content={message.content} />}
          </div>
        )}
        {message.parsedTransaction && (
          <TransactionDraftCard
            transaction={message.parsedTransaction}
            onReview={() => onReviewTransaction(message)}
          />
        )}
      </div>
      {isUser && (
        <div className="ai-avatar ai-avatar--user"><User size={14} aria-hidden="true" /></div>
      )}
    </article>
  );
}
