"use client";

/** Menyinkronkan komponen React dengan hasil media query browser. */
import { useSyncExternalStore } from "react";

interface MediaQueryStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => boolean;
}

const mediaQueryStores = new Map<string, MediaQueryStore>();
const getServerSnapshot = () => false;

function getMediaQueryStore(query: string): MediaQueryStore {
  const existing = mediaQueryStores.get(query);
  if (existing) return existing;

  let mediaQuery: MediaQueryList | null = null;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const getMediaQuery = () => {
    if (!mediaQuery) mediaQuery = window.matchMedia(query);
    return mediaQuery;
  };

  const store: MediaQueryStore = {
    subscribe(listener) {
      const target = getMediaQuery();
      if (listeners.size === 0) target.addEventListener("change", notify);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) target.removeEventListener("change", notify);
      };
    },
    getSnapshot: () => getMediaQuery().matches,
  };

  mediaQueryStores.set(query, store);
  return store;
}

export function useMediaQuery(query: string): boolean {
  const store = getMediaQueryStore(query);
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot
  );
}
