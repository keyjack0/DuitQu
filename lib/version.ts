export const APP_VERSION = "0.3.0";

export const RELEASE_NOTES = [
  "Desain ulang UI lebih minimalis & modern",
  "Ikon transaksi & dompet kini berwarna sesuai kategori",
  "Background ikon dompet mengikuti warna ikon",
  "Shadow & rounded corner seragam di seluruh halaman",
  "Bottom navigation tanpa border, pakai shadow",
  "Skeleton loading dengan shimmer animation",
  "Icon strokeWidth lebih tebal (3px)",
  "Optimasi loading halaman transaksi",
  "Perbaikan bug & konsistensi CSS",
];

export interface ChangelogEntry {
  version: string;
  date: string;
  notes: string[];
}

export const CHANGELOG_HISTORY: ChangelogEntry[] = [
  {
    version: "0.3.0",
    date: "2026-08-29",
    notes: [
      "Desain ulang UI lebih minimalis & modern",
      "Ikon transaksi & dompet kini berwarna sesuai kategori",
      "Background ikon dompet mengikuti warna ikon",
      "Shadow & rounded corner seragam di seluruh halaman",
      "Bottom navigation tanpa border, pakai shadow",
      "Skeleton loading dengan shimmer animation",
      "Icon strokeWidth lebih tebal (3px)",
      "Optimasi loading halaman transaksi",
      "Perbaikan bug & konsistensi CSS",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-08-22",
    notes: [
      "Perbaikan edit dompet kini tersimpan dengan benar",
      "Notifikasi sukses/gagal kini akurat",
      "Pesan AI mendukung teks tebal, miring & daftar",
      "Tampilan atas halaman dirapikan",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-08-01",
    notes: [
      "Dashboard keuangan real-time dengan grafik",
      "Manajemen multi-dompet & transfer antar dompet",
      "Pencatatan transaksi, budget per kategori, AI Assistant (Gemini)",
      "Progressive Web App (PWA) — bisa dipasang & berjalan offline",
    ],
  },
];
