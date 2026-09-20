/** Mendefinisikan konten dan ilustrasi untuk langkah-langkah onboarding. */
export type OnboardingVisualKind = "wallets" | "analytics" | "budget" | "progress";

export type OnboardingIllustration = {
  src: string;
  width: number;
  height: number;
};

type OnboardingStep = {
  title: string;
  description: string;
  visual: OnboardingVisualKind;
  image: OnboardingIllustration;
};

export const onboardingSteps: readonly OnboardingStep[] = [
  {
    title: "Semua Keuanganmu, Satu Tempat",
    description: "Kelola cash, bank, e-wallet, tabungan, dan investasi dengan lebih mudah.",
    visual: "wallets",
    image: { src: "/images/onboarding/onboarding-2.png", width: 1122, height: 1402 },
  },
  {
    title: "Tahu Ke Mana Uangmu Pergi",
    description: "Catat pemasukan dan pengeluaran, lalu pahami pola keuanganmu dengan lebih jelas.",
    visual: "analytics",
    image: { src: "/images/onboarding/onboarding-1.png", width: 1122, height: 1402 },
  },
  {
    title: "Kendalikan Pengeluaranmu",
    description: "Atur budget dan pantau penggunaannya agar pengeluaran tetap sesuai rencana.",
    visual: "budget",
    image: { src: "/images/onboarding/onboarding-4.png", width: 1024, height: 1536 },
  },
  {
    title: "Bangun Keuangan yang Lebih Baik",
    description: "Pantau perkembangan keuanganmu dan bangun kebiasaan finansial yang lebih baik bersama DuitQu.",
    visual: "progress",
    image: { src: "/images/onboarding/onboarding-3.png", width: 1122, height: 1402 },
  },
];
