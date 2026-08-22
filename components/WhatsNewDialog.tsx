"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { APP_VERSION, RELEASE_NOTES } from "@/lib/version";

const STORAGE_KEY = "duitqu_last_version";

const subscribeNoop = () => () => {};

function getLastVersion(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerVersion(): string | null {
  return APP_VERSION;
}

export function WhatsNewDialog() {
  const lastVersion = useSyncExternalStore(
    subscribeNoop,
    getLastVersion,
    getServerVersion
  );
  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, APP_VERSION);
    setDismissed(true);
  }, []);

  if (dismissed || lastVersion === APP_VERSION) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && dismiss()}>
      <div className="dialog-card">
        <p className="dialog-title">Apa yang baru di v{APP_VERSION}? 🎉</p>
        <ul className="whats-new-list">
          {RELEASE_NOTES.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
        <div className="dialog-actions mt-5">
          <button onClick={dismiss} className="btn-primary">
            Oke
          </button>
        </div>
      </div>
    </div>
  );
}
