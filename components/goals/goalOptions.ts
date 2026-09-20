/** Mendefinisikan pilihan ikon, warna, dan utilitas nominal untuk target keuangan. */
import { Target, Wallet, House, Car, Plane, Gift, BookOpen, Heart } from "lucide-react";

export const goalIcons = { target: Target, wallet: Wallet, home: House, car: Car, plane: Plane, gift: Gift, book: BookOpen, heart: Heart };
export const goalIconNames: Record<string, string> = { target: "Target", wallet: "Tabungan", home: "Rumah", car: "Kendaraan", plane: "Perjalanan", gift: "Hadiah", book: "Pendidikan", heart: "Kesehatan" };
export const goalColors = [
  { value: "#22c55e", name: "Hijau" }, { value: "#3b82f6", name: "Biru" },
  { value: "#f59e0b", name: "Kuning" }, { value: "#ef4444", name: "Merah" },
  { value: "#8b5cf6", name: "Ungu" }, { value: "#ec4899", name: "Merah muda" },
  { value: "#14b8a6", name: "Toska" }, { value: "#f97316", name: "Jingga" },
];

export function formatGoalAmount(value: string) {
  return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseGoalAmount(value: string) {
  return Number(value.replace(/\./g, "") || "0");
}
