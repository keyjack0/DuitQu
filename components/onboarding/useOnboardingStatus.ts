"use client";

/** Menyimpan dan menyinkronkan status penyelesaian onboarding di browser. */
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "duitqu_onboarding_seen";
const CHANGE_EVENT = "duitqu:onboarding-completed";
let completedInMemory = false;

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

function getSnapshot(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true" || completedInMemory;
  } catch {
    return completedInMemory;
  }
}

// The server and first hydration render share a neutral state, avoiding a flash of either screen.
function getServerSnapshot(): null {
  return null;
}

export function completeOnboarding() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // Blocked storage must never prevent access to login in the current session.
    completedInMemory = true;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useOnboardingStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
