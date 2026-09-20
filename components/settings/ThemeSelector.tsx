"use client";

/**
 * Menampilkan pilihan tema eksplisit agar pengguna dapat memilih tema sistem,
 * terang, atau gelap tanpa bergantung pada arti sebuah ikon.
 */
import { Laptop, Moon, Sun } from "lucide-react";
import { useThemePreference, type ThemePreference } from "@/components/ThemeToggle";

const options: Array<{ value: ThemePreference; label: string; icon: typeof Laptop }> = [
  { value: "system", label: "Sistem", icon: Laptop },
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
];

export function ThemeSelector() {
  const { preference, setPreference } = useThemePreference();
  return (
    <fieldset className="theme-selector">
      <legend className="sr-only">Pilih tema tampilan</legend>
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={preference === value}
          className={`theme-option ${preference === value ? "theme-option--active" : ""}`}
          onClick={() => setPreference(value)}
        >
          <Icon size={16} aria-hidden="true" />
          {label}
        </button>
      ))}
    </fieldset>
  );
}
