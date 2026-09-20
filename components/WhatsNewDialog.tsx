"use client";

/** Menampilkan catatan rilis terbaru satu kali untuk setiap versi aplikasi. */
import { useCallback, useState, useSyncExternalStore } from "react";
import { APP_VERSION, RELEASE_NOTES } from "@/lib/version";

const STORAGE_KEY = "duitqu_last_version";

const subscribeNoop = () => () => {};

function getLastVersion(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerVersion(): string | null {
  return APP_VERSION;
}

function compareVersions(left: string, right: string) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

export function WhatsNewDialog() {
  const lastVersion = useSyncExternalStore(
    subscribeNoop,
    getLastVersion,
    getServerVersion
  );
  const [dismissed, setDismissed] = useState(false);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, APP_VERSION);
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
    }
    setDismissed(true);
  }, []);

  if (dismissed || (lastVersion !== null && compareVersions(APP_VERSION, lastVersion) <= 0)) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && dismiss()}>
      <div className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="whats-new-title">
        <p className="dialog-title" id="whats-new-title">Apa yang baru di v{APP_VERSION}? 🎉</p>
        <ul className="whats-new-list">
          {RELEASE_NOTES.map((note) => (
            <li key={note}>{note}</li>
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
