# DuitQu

[![Version](https://img.shields.io/badge/version-1.3.0-16a34a)](CHANGELOG.md)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

DuitQu adalah aplikasi manajemen keuangan pribadi berbasis web untuk mencatat arus kas, mengelola beberapa dompet, memantau budget dan target, serta menganalisis keuangan bersama Google Gemini.

Versi `1.3.0` menambahkan Financial Goals, Kalender Keuangan, Laporan Bulanan, ekspor PDF/JSON, onboarding, dan desain baru untuk AI Assistant serta Profil.

## Fitur

### Dashboard

- Total saldo yang dapat disembunyikan.
- Pemasukan dan pengeluaran minggu berjalan.
- Grafik pengeluaran untuk periode 7, 14, atau 30 hari.
- Distribusi pengeluaran bulan berjalan per kategori.
- Ringkasan dompet dan lima transaksi terbaru.
- Akses cepat ke Goals, Kalender, Budget, dan Laporan.

### Dompet dan Transaksi

- Beberapa dompet dengan nama, saldo, ikon, dan warna.
- Transfer antar-dompet dan perhitungan saldo melalui trigger database.
- Detail arus kas, distribusi kategori, dan aktivitas terbaru per dompet.
- Transaksi pemasukan, pengeluaran, dan transfer.
- Pencarian serta filter tipe, kategori, dan tanggal berbasis server.
- Perbandingan pemasukan atau pengeluaran dari dua bulan.
- Riwayat bertahap dengan pagination, loading, empty, dan retry state.

Transfer dapat dihapus tetapi tidak dapat diedit. Menghapus dompet tidak menghapus riwayat transaksi; referensi dompet asal menjadi kosong sesuai aturan database.

### Perencanaan

- Budget bulanan per kategori dengan status aman, peringatan, dan bahaya.
- Financial Goals dengan target, jumlah terkumpul manual, tenggat, ikon, dan warna.
- Kalender bulanan dengan indikator transaksi dan detail setiap hari.
- Laporan bulanan berisi arus kas, savings rate, perbandingan bulan lalu, minggu, dan kategori terbesar.
- Ekspor laporan bulanan ke PDF langsung dari browser.

Goals berdiri sendiri dan tidak otomatis memindahkan saldo dari atau ke dompet.

### DuitQu AI

- Percakapan keuangan dengan model Gemini 3.1 Flash Lite.
- Ringkasan kondisi keuangan dan saran prompt yang kontekstual.
- Deteksi draft transaksi dari bahasa natural.
- Form review untuk mengubah nominal, kategori, dompet, tipe, deskripsi, dan tanggal sebelum transaksi disimpan.
- Riwayat percakapan, pagination, retry, stop, dan penghapusan riwayat.
- Tampilan teks tebal, miring, inline code, dan daftar pada jawaban AI.

Hasil AI dapat keliru dan harus diperiksa sebelum digunakan untuk keputusan atau pencatatan keuangan.

### Akun dan Profil

- Registrasi dan login menggunakan Supabase Auth.
- Konfirmasi email mengikuti konfigurasi Auth pada project Supabase.
- Ubah nama profil dan kata sandi.
- Tema sistem, terang, atau gelap.
- Ekspor profil dan data keuangan ke JSON.
- Hapus riwayat AI tanpa menghapus transaksi yang sudah disimpan.
- Riwayat pembaruan dan versi aplikasi.

## Privasi AI

Saat pengguna mengirim pesan ke DuitQu AI, aplikasi mengirim data berikut ke Google Gemini:

- Pesan baru dan hingga 50 pesan percakapan yang sedang dimuat.
- Total saldo dan saldo setiap dompet.
- Ringkasan pemasukan, pengeluaran, net, dan savings rate bulan berjalan.
- Budget beserta pemakaian dan sisa nominal.
- Nama dan progres Financial Goals.
- Hingga lima transaksi terbaru yang dimuat.

Aplikasi tidak sengaja memasukkan password, token autentikasi, email, nama pengguna, ID dompet, atau seluruh riwayat transaksi. Teks yang diketik pengguna tetap dapat berisi informasi pribadi. API key Gemini hanya digunakan pada server melalui `app/api/ai/route.ts`.

Ekspor JSON diproses pada browser dan berisi profil, dompet, transaksi, budget, goals, serta percakapan AI pengguna.

## PWA

DuitQu memiliki web manifest dan dapat dipasang sebagai aplikasi standalone pada browser yang mendukung. Service worker hanya melakukan runtime caching untuk aset statis dari `/_next/static/`, `/icons/`, `/images/`, dan `manifest.json`.

Navigasi halaman, autentikasi, API, React Server Components, Supabase, data keuangan, dan Gemini tetap membutuhkan koneksi internet. DuitQu tidak menjanjikan penggunaan aplikasi secara penuh saat offline.

## Teknologi

| Area | Teknologi |
| --- | --- |
| Framework | Next.js 16.3.5, React 19.2.4, TypeScript 5 |
| Styling | Tailwind CSS 4, CSS modules global berbasis design tokens |
| State | Zustand 5 dengan persist middleware |
| Database dan Auth | Supabase PostgreSQL, `@supabase/ssr`, `@supabase/supabase-js` |
| AI | Google Gemini 3.1 Flash Lite |
| Grafik | Recharts 3.8.1 |
| PDF | jsPDF 4.2.1 |
| UI | Lucide React, React Toastify |
| PWA | Web manifest dan service worker kustom |

## Persyaratan

- Node.js 20.9 atau lebih baru.
- npm dengan dukungan lockfile versi yang digunakan repository.
- Project Supabase.
- Google Gemini API key.
- Browser modern yang masih menerima pembaruan keamanan.

## Instalasi Baru

1. Clone repository dan instal dependency.

```bash
git clone https://github.com/keyjack0/DuitQu.git
cd DuitQu
npm ci
```

2. Buat project Supabase, buka SQL Editor, lalu jalankan `supabase-schema.sql` satu kali pada database kosong.

Schema tersebut membuat tabel berikut:

- `users`
- `wallets`
- `transactions`
- `budgets`
- `ai_chats`
- `financial_goals`

Schema juga mengaktifkan Row Level Security, membuat policy kepemilikan data, profile trigger, index, dan trigger perhitungan saldo dompet.

3. Siapkan environment lokal.

```bash
cp .env.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

`GEMINI_API_KEY` bersifat server-only. Jangan mengganti namanya menjadi `NEXT_PUBLIC_GEMINI_API_KEY`.

4. Jalankan development server.

```bash
npm run dev
```

Buka `http://localhost:3000`. Pengguna tanpa sesi akan diarahkan ke `/login`.

## Upgrade ke 1.3.0

Database yang dibuat dengan versi DuitQu sebelumnya harus menjalankan migration berikut sebelum aplikasi `1.3.0` dideploy:

```text
supabase/migrations/20260920_130_financial_goals.sql
```

Migration menambahkan tabel `financial_goals`, RLS policy, index goals, dan composite index untuk pagination riwayat AI. Migration bersifat additive dan tidak menghapus data lama.

Jangan menjalankan ulang seluruh `supabase-schema.sql` pada database existing karena beberapa policy pada bootstrap schema tidak dirancang sebagai migration yang dapat diulang.

Urutan upgrade produksi:

1. Buat backup database.
2. Jalankan migration melalui Supabase SQL Editor.
3. Verifikasi operasi CRUD Goals menggunakan user terautentikasi.
4. Deploy aplikasi `1.3.0`.
5. Jalankan smoke test route utama.

## Route

| Route | Fungsi |
| --- | --- |
| `/login` | Login dan onboarding perangkat pertama |
| `/register` | Registrasi akun |
| `/dashboard` | Ringkasan saldo, grafik, dan akses cepat |
| `/transactions` | Riwayat, pencarian, filter, dan perbandingan transaksi |
| `/wallets` | Dompet, detail, dan transfer |
| `/budgets` | Budget kategori |
| `/goals` | Target tabungan manual |
| `/calendar` | Kalender dan detail transaksi harian |
| `/report` | Analisis bulanan dan ekspor PDF |
| `/ai-assistant` | Chat dan draft transaksi berbasis Gemini |
| `/settings` | Profil, keamanan, tema, data, dan versi |
| `/api/ai` | Endpoint Gemini terautentikasi |
| `/version.json` | Metadata versi deployment tanpa cache |

Route aplikasi selain autentikasi dan aset publik dilindungi oleh `proxy.ts`.

## Struktur Utama

```text
app/
  (app)/               halaman pengguna terautentikasi
  api/ai/              integrasi Gemini server-side
  styles/              style per fitur
components/
  ai/                   UI Assistant dan draft transaksi
  dashboard/            komponen dashboard
  finance/              primitive UI halaman finansial
  goals/                form dan opsi Financial Goals
  onboarding/           onboarding login pertama
  settings/             komponen Profil dan Pengaturan
  transactions/         modal transaksi
  wallets/              transfer dan detail dompet
hooks/                  media query, pagination, dan data periode
lib/                    store, Supabase, laporan, ekspor, dan versi
public/                 manifest, service worker, icon, dan gambar
scripts/                generator dan pemeriksa metadata versi
supabase/migrations/    migration untuk database existing
types/                  type aplikasi
```

## Scripts

```bash
npm run dev             # Development server
npm run lint            # ESLint
npm run typecheck       # TypeScript tanpa emit
npm run build           # Generate version.json dan production build
npm start               # Menjalankan production build
npm run analyze         # Analisis bundle dengan webpack
npm run version:check   # Memastikan metadata versi sinkron
npm run release:check   # Lint, typecheck, build, dan version check
```

Project belum memiliki automated test suite. Sebelum release, lakukan smoke test autentikasi, CRUD finansial, transfer, filter, Goals, Kalender, Laporan, AI, ekspor, tema, dan PWA pada mobile serta desktop.

## Deployment

Vercel adalah target deployment utama karena aplikasi menggunakan route server untuk Gemini dan proxy autentikasi.

1. Terapkan migration database yang dibutuhkan.
2. Hubungkan repository ke Vercel.
3. Tambahkan tiga environment variables dari `.env.example`.
4. Jalankan `npm run release:check`.
5. Deploy branch atau commit release.
6. Verifikasi `/version.json`, `/sw.js`, login, Goals, dan API AI di production.

Hosting statis murni tidak didukung karena `/api/ai` dan autentikasi server memerlukan runtime Next.js.

## Troubleshooting

### `GEMINI_API_KEY tidak dikonfigurasi`

- Pastikan key tersedia di `.env.local` atau environment production.
- Gunakan nama `GEMINI_API_KEY` tanpa prefix `NEXT_PUBLIC_`.
- Restart development server setelah mengubah environment.

### Goals gagal dimuat atau disimpan

- Jalankan migration `20260920_130_financial_goals.sql`.
- Periksa tabel, RLS, policy, dan user session di Supabase.

### Saldo dompet tidak berubah

- Pastikan fungsi `recalc_wallet_balance`, `set_wallet_balance`, dan trigger `trigger_update_wallet_balance` tersedia.
- Periksa error database pada Supabase Logs.

### PWA tidak dapat dipasang

- Gunakan HTTPS atau localhost.
- Pastikan `manifest.json`, icon 192/512, dan `/sw.js` dapat diakses.
- Periksa dukungan instalasi PWA pada browser dan platform yang digunakan.

### Build gagal karena versi

- Samakan `package.json`, `lib/version.ts`, dan entry teratas `CHANGELOG.md`.
- Jalankan `npm run version:generate` lalu `npm run version:check`.

## Kontribusi

1. Fork repository.
2. Buat branch perubahan.
3. Ikuti TypeScript dan ESLint project.
4. Jalankan `npm run release:check`.
5. Buat pull request dengan penjelasan perubahan dan langkah pengujian.

Hindari memasukkan `.env`, API key, data keuangan, atau screenshot yang mengandung informasi pribadi.

## Lisensi dan Dukungan

DuitQu dirilis di bawah [MIT License](LICENSE), copyright 2026 keyjack0.

Gunakan [GitHub Issues](https://github.com/keyjack0/DuitQu/issues) untuk laporan bug dan permintaan fitur.
