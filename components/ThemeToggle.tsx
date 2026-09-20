"use client";

/**
 * Menyediakan state tema global DuitQu dan tombol ringkas untuk mengganti
 * tema. Preferensi "system" mengikuti perubahan tema perangkat secara live.
 */
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

export type Theme = "dark" | "light";
export type ThemePreference = Theme | "system";

const STORAGE_KEY = "duitqu-theme";
const listeners = new Set<() => void>();
let currentPreference: ThemePreference = "system";
let resolvedTheme: Theme = "dark";
let initialized = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function resolveSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(preference: ThemePreference) {
  resolvedTheme = preference === "system" ? resolveSystemTheme() : preference;
  document.documentElement.setAttribute("data-theme", resolvedTheme);
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {}
  currentPreference = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  applyTheme(currentPreference);
  const media = window.matchMedia("(prefers-color-scheme: light)");
  media.addEventListener("change", () => {
    if (currentPreference !== "system") return;
    applyTheme("system");
    emit();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  ensureInitialized();
  return `${currentPreference}:${resolvedTheme}`;
}

function getServerSnapshot() {
  return "system:dark";
}

export function setThemePreference(preference: ThemePreference) {
  ensureInitialized();
  currentPreference = preference;
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {}
  applyTheme(preference);
  emit();
}

export function useThemePreference() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [preference, theme] = snapshot.split(":") as [ThemePreference, Theme];
  return { preference, theme, setPreference: setThemePreference };
}

export function ThemeToggle() {
  const { theme, setPreference } = useThemePreference();
  const isLight = theme === "light";
  return (
    <button
      type="button"
      onClick={() => setPreference(isLight ? "dark" : "light")}
      aria-label={isLight ? "Aktifkan mode gelap" : "Aktifkan mode terang"}
      title={isLight ? "Mode gelap" : "Mode terang"}
      className="icon-btn-round"
    >
      {isLight ? <Moon size={20} strokeWidth={2} aria-hidden="true" /> : <Sun size={20} strokeWidth={2} aria-hidden="true" />}
    </button>
  );
}
