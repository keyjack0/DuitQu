/** Metadata rilis yang ditampilkan pada UI dan dialog pembaruan DuitQu. */
export const APP_VERSION = "1.3.0";

export const RELEASE_NOTES = [
  "Target tabungan, kalender keuangan, dan laporan bulanan baru",
  "Laporan dapat diekspor ke PDF langsung dari browser",
  "DuitQu AI kini memiliki ringkasan keuangan dan review transaksi",
  "Riwayat transaksi mendukung pencarian, filter, dan pagination",
  "Profil baru dengan tema sistem, keamanan, dan ekspor data",
  "Detail dompet, onboarding, aksesibilitas, dan tampilan responsif ditingkatkan",
];

export interface ChangelogEntry {
  version: string;
  date: string;
  notes: string[];
}

export const CHANGELOG_HISTORY: ChangelogEntry[] = [
  {
    version: "1.3.0",
    date: "2026-09-20",
    notes: RELEASE_NOTES,
  },
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
      "Dashboard keuangan dengan grafik",
      "Manajemen multi-dompet & transfer antar dompet",
      "Pencatatan transaksi, budget per kategori, AI Assistant (Gemini)",
      "Progressive Web App (PWA) yang dapat dipasang pada perangkat yang mendukung",
    ],
  },
];
