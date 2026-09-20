"use client";

/** Menyediakan input pesan adaptif beserta kontrol kirim dan hentikan. */
import { useLayoutEffect, useRef } from "react";
import { Send, Square } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  disabled: boolean;
  isLoading: boolean;
}

export function AssistantComposer({ value, onChange, onSend, onStop, disabled, isLoading }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 104)}px`;
  }, [value]);

  return (
    <div className="ai-input-bar">
      <textarea
        ref={textareaRef}
        rows={1}
        aria-label="Pesan untuk DuitQu AI"
        placeholder="Tulis transaksi atau tanyakan keuanganmu..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            if (!disabled && value.trim()) onSend();
          }
        }}
        className="ai-input"
        disabled={disabled && !isLoading}
      />
      <button
        type="button"
        onClick={isLoading ? onStop : onSend}
        disabled={!isLoading && (disabled || !value.trim())}
        aria-label={isLoading ? "Hentikan jawaban" : "Kirim pesan"}
        className={`ai-send-btn ${(isLoading || (!disabled && value.trim())) ? "ai-send-btn--on" : ""}`}
      >
        {isLoading ? <Square size={14} fill="currentColor" aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}
      </button>
    </div>
  );
}
