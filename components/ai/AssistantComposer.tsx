"use client";

/** Menyediakan input pesan adaptif beserta kontrol kirim dan hentikan. */
import { useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from "react";
import { Send, Square } from "lucide-react";

const MAX_MESSAGE_CHARS = 8000;

interface Props {
  ref?: Ref<AssistantComposerHandle>;
  onSend: (value: string) => boolean;
  onStop: () => void;
  disabled: boolean;
  isLoading: boolean;
}

export interface AssistantComposerHandle {
  clear: () => void;
}

export function AssistantComposer({ ref, onSend, onStop, disabled, isLoading }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({ clear: () => setValue("") }), []);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 104)}px`;
  }, [value]);

  function submit() {
    const message = value.trim();
    if (message) onSend(message);
  }

  return (
    <div className="ai-input-bar">
      <textarea
        ref={textareaRef}
        rows={1}
        aria-label="Pesan untuk DuitQu AI"
        placeholder="Tulis transaksi atau tanyakan keuanganmu..."
        value={value}
        maxLength={MAX_MESSAGE_CHARS}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            if (!disabled && !isLoading) submit();
          }
        }}
        className="ai-input"
        disabled={disabled && !isLoading}
      />
      <button
        type="button"
        onClick={isLoading ? onStop : submit}
        disabled={!isLoading && (disabled || !value.trim())}
        aria-label={isLoading ? "Hentikan jawaban" : "Kirim pesan"}
        className={`ai-send-btn ${(isLoading || (!disabled && value.trim())) ? "ai-send-btn--on" : ""}`}
      >
        {isLoading ? <Square size={14} fill="currentColor" aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}
      </button>
    </div>
  );
}
