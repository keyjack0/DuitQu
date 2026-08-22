"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "dark" | "light";

const STORAGE_KEY = "duitqu-theme";

const listeners = new Set<() => void>();
let currentTheme: Theme = "dark";
let initialized = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") {
    currentTheme = attr;
    return;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    currentTheme = stored;
    return;
  }
  currentTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function getSnapshot() {
  ensureInitialized();
  return currentTheme;
}

function getServerSnapshot() {
  return "dark" as Theme;
}

function toggleTheme() {
  const next: Theme = currentTheme === "light" ? "dark" : "light";
  currentTheme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {}
  document.documentElement.setAttribute("data-theme", next);
  emit();
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Aktifkan mode gelap" : "Aktifkan mode terang"}
      title={isLight ? "Mode gelap" : "Mode terang"}
      className="icon-btn-round"
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}