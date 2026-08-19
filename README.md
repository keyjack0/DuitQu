# DuitQu

Aplikasi manajemen keuangan pribadi berbasis web (PWA) dengan AI assistant yang cerdas. Kelola dompet, transaksi, budget, dan dapatkan insight keuangan secara real-time, di mana saja dan kapan saja.

## Daftar Isi
- [Tentang Project](#tentang-project)
- [Fitur Utama](#fitur-utama)
- [Tampilan Aplikasi](#tampilan-aplikasi)
- [Tech Stack](#tech-stack)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi](#instalasi)
- [Setup Environment](#setup-environment)
- [Struktur Project](#struktur-project)
- [Penggunaan](#penggunaan)
- [Development](#development)
- [Build & Deploy](#build--deploy)
- [Troubleshooting](#troubleshooting)
- [Kontribusi](#kontribusi)
- [License](#license)

## Tentang Project

**DuitQu** adalah aplikasi web modern untuk manajemen keuangan pribadi yang dirancang dengan pengalaman pengguna terbaik. Aplikasi ini dilengkapi dengan:

- Progressive Web App (PWA) — dapat di-install dan tetap berfungsi saat offline
- AI Assistant berbasis Google Gemini yang memahami perintah bahasa natural
- Dashboard analytics dengan visualisasi interaktif
- Multi-wallet management dengan fitur transfer antar dompet
- Budget tracking per kategori pengeluaran
- Mode tampilan terang dan gelap
- Desain responsif yang bekerja baik di desktop, tablet, maupun mobile

Sempurna untuk individu yang ingin mengontrol keuangan pribadi mereka dengan lebih baik dan membuat keputusan finansial yang lebih terinformasi.

## Fitur Utama

### 1. **Dashboard Keuangan Real-time**
- Ringkasan total saldo yang bisa disembunyikan/ditampilkan
- Pemasukan dan pengeluaran bulan ini
- Grafik pengeluaran 7 hari terakhir (area chart)
- Pie chart breakdown pengeluaran per kategori
- Kartu dompet dan daftar transaksi terbaru

### 2. **Multi-Wallet Management**
- Kelola multiple wallets/akun dengan nama, saldo, dan ikon
- Total saldo dan distribusi antar dompet
- **Transfer antar dompet** secara langsung
- Edit atau hapus dompet dengan gestur swipe

### 3. **Manajemen Transaksi**
- Catat transaksi pemasukan atau pengeluaran dengan detail lengkap
- 12 kategori transaksi (makanan, transportasi, hiburan, dll)
- Cari transaksi dan filter berdasarkan tipe (pemasukan/pengeluaran)
- Transaksi dikelompokkan per tanggal beserta jam pencatatan
- Edit/hapus transaksi dengan gestur swipe
- Muat lebih banyak transaksi secara bertahap

### 4. **Budget Tracking**
- Set budget limit per kategori untuk periode bulanan
- Monitor pengeluaran vs budget dengan progress bar
- Status visual: aman, peringatan (>=70%), dan bahaya (>=90%)
- Banner peringatan otomatis untuk kategori yang melebihi 90% budget

### 5. **AI Assistant Cerdas (Gemini)**
- Catat transaksi menggunakan natural language, contoh: *"beli kopi di kafe 50 ribu"*
- AI mendeteksi nominal, kategori, dan tipe transaksi secara otomatis
- Analisis keuangan dan jawaban seputar keuangan pribadi
- Quick prompts untuk memulai percakapan
- Riwayat chat tersimpan dan dapat dihapus

### 6. **Autentikasi Pengguna**
- Register akun baru dengan nama, email, dan password
- Login dengan email dan password
- Verifikasi email untuk keamanan akun

### 7. **Pengaturan Akun**
- Ubah nama profil
- Ganti mode tampilan terang/gelap
- Keluar dari akun

### 8. **Progressive Web App (PWA)**
- Install aplikasi langsung di smartphone/tablet
- Bekerja offline dengan app shell yang ter-cache
- Icon di home screen seperti aplikasi native

<!-- ## Tampilan Aplikasi

| Dashboard | Transaksi | AI Assistant |
|:---:|:---:|:---:|
| ![Dashboard](public/screenshots/dashboard.png) | ![Transaksi](public/screenshots/transactions.png) | ![AI Assistant](public/screenshots/ai-assistant.png) |

*Screenshot placeholder — tambahkan gambar Anda pada folder `public/screenshots/`.* -->

## Tech Stack

| Aspek | Teknologi | Versi |
|-------|-----------|-------|
| **Frontend Framework** | Next.js (App Router) | 16.2.6 |
| **React Version** | React | 19.2.4 |
| **Styling** | Tailwind CSS (CSS variables) | 4 |
| **State Management** | Zustand (+ persist middleware) | 5.0.14 |
| **Backend/Database** | Supabase (PostgreSQL) | - |
| **Supabase SSR** | @supabase/ssr | ^0.10.3 |
| **Supabase Client** | @supabase/supabase-js | ^2.106.2 |
| **AI Integration** | Google Gemini (Gemini 3.1 Flash Lite) | - |
| **Charts & Graphs** | Recharts | 3.8.1 |
| **PWA** | next-pwa | 5.6.0 |
| **Icons** | Lucide React | 1.17.0 |
| **Notifications** | React Toastify | 11.1.0 |
| **Utility** | clsx, tailwind-merge | 2.1.1 / 3.6.0 |
| **Type Checking** | TypeScript | 5 |
| **Linting** | ESLint | 9 |

## Persyaratan Sistem

- **Node.js** >= 20.9.0
- **npm** >= 9.x atau **yarn** >= 3.x
- **Browser modern** dengan support PWA:
  - Chrome/Chromium 40+
  - Firefox 44+
  - Safari 15.1+
  - Edge 17+

## Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd duitqu
```

### 2. Install Dependencies
```bash
npm install
# atau jika menggunakan yarn
yarn install
```

## Setup Environment

### 1. Setup Supabase

**Step 1: Buat Project Supabase**
1. Kunjungi [supabase.com](https://supabase.com)
2. Login atau daftar akun baru
3. Klik "New Project"
4. Isi nama project dan password
5. Tunggu project selesai dibuat

**Step 2: Setup Database Schema**
1. Masuk ke Supabase Dashboard
2. Buka "SQL Editor"
3. Buat query baru
4. Copy-paste isi dari file `supabase-schema.sql`
5. Jalankan query dengan klik tombol "Run"

File ini akan membuat tabel `users`, `wallets`, `transactions`, `budgets`, dan `ai_chats`, lengkap dengan Row Level Security (RLS), trigger untuk menghitung saldo dompet otomatis, serta trigger pembuatan profil saat signup.

**Step 3: Ambil Credentials**
1. Buka "Settings" → "API"
2. Copy "Project URL" dan "anon public" key
3. Simpan untuk step berikutnya

### 2. Setup Google Gemini API Key

**Step 1: Dapatkan API Key**
1. Kunjungi [Google AI Studio](https://aistudio.google.com/apikey)
2. Login dengan akun Google
3. Klik "Create API Key"
4. Copy dan simpan API key tersebut

**Step 2: Buat `.env.local`**
```bash
cp .env.example .env.local
```

**Isi file `.env.local`:**
```
# Supabase Configuration
# Dapatkan dari: https://app.supabase.com → Settings → API
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini API (server-side, jangan di-prefix NEXT_PUBLIC_)
# Dapatkan dari: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key
```

> **Catatan:** `GEMINI_API_KEY` hanya dipakai di server (file `app/api/ai/route.ts`) dan tidak boleh diekspos ke browser. Jangan beri prefix `NEXT_PUBLIC_`.

### 3. Verifikasi Setup
```bash
npm run dev
```

Buka http://localhost:3000 di browser. Jika berhasil, Anda akan diarahkan ke halaman login.

## Struktur Project

```
duitqu/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── ai/
│   │       └── route.ts          # AI Assistant endpoint (Gemini, rate-limited)
│   ├── login/                    # Halaman login
│   │   └── page.tsx
│   ├── register/                 # Halaman register
│   │   └── page.tsx
│   ├── dashboard/                # Dashboard page
│   ├── transactions/             # Manajemen transaksi
│   ├── wallets/                  # Manajemen dompet
│   ├── budgets/                  # Budget tracking
│   ├── ai-assistant/             # AI chat interface
│   ├── settings/                 # Pengaturan akun
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (redirect ke dashboard)
│   └── globals.css               # Global styles & CSS variables tema
│
├── components/                   # Reusable React components
│   ├── layout/                   # Layout components
│   │   ├── AppLayout.tsx         # Main app layout wrapper
│   │   └── BottomNav.tsx         # Mobile bottom navigation
│   ├── transactions/             # Transaction components
│   │   ├── AddTransactionModal.tsx
│   │   └── LazyAddTransactionModal.tsx
│   ├── wallets/
│   │   └── TransferModal.tsx     # Modal transfer antar dompet
│   ├── ui/                       # Reusable UI components
│   │   ├── ConfirmDialog.tsx     # Dialog konfirmasi
│   │   └── SwipeableRow.tsx      # Row dengan gestur swipe
│   ├── DataInitializer.tsx       # Sinkronisasi data dari Supabase
│   ├── ExpenseChart.tsx          # Grafik pengeluaran 7 hari
│   ├── CategoryPieChart.tsx      # Pie chart per kategori
│   ├── ThemeToggle.tsx           # Toggle tema terang/gelap
│   └── ServiceWorkerRegister.tsx # Registrasi service worker
│
├── hooks/                        # Custom React hooks
│   └── useMediaQuery.ts
│
├── lib/                          # Utility functions & libraries
│   ├── supabase.ts               # Supabase client setup
│   ├── store.ts                  # Zustand store (state management)
│   ├── icons.tsx                 # Icon definitions kategori & dompet
│   └── utils.ts                  # Utility functions
│
├── types/                        # TypeScript type definitions
│   └── index.ts                  # Global type exports
│
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service Worker
│   ├── icons/                    # App icons
│   └── screenshots/              # Screenshot aplikasi
│
├── proxy.ts                      # Guard autentikasi (pengganti middleware)
├── supabase-schema.sql           # Skema database Supabase
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.mjs             # ESLint configuration
├── postcss.config.mjs            # PostCSS configuration
├── package.json                  # Project dependencies
└── README.md                     # This file
```

## Penggunaan

### 1. **Akses Aplikasi**
```bash
npm run dev
```
Buka http://localhost:3000

### 2. **Buat Akun**
- Klik "Daftar" untuk membuat akun baru
- Isi nama, email, dan password (minimal 6 karakter)
- Verifikasi email melalui link yang dikirim ke email Anda
- Kembali ke halaman login untuk masuk

### 3. **Setup Dompet**
- Setelah login, buka menu **Dompet**
- Tambahkan dompet dengan nama, saldo awal, dan ikon (misal: BCA Tabungan, GoPay)
- Buat minimal 2 dompet untuk dapat melakukan transfer antar dompet

### 4. **Catat Transaksi**
- Gunakan tombol "Tambah Transaksi" atau ikon `+` di halaman Transaksi
- Pilih tipe pemasukan/pengeluaran, isi nominal, deskripsi, kategori, dompet, dan tanggal
- **Atau lebih cepat:** buka menu **AI** dan ketik natural language, contoh: *"barusan beli kopi 50rb pake QRIS, catat ya"* — AI akan mendeteksi transaksinya dan Anda tinggal konfirmasi

### 5. **Transfer Antar Dompet**
- Buka menu **Dompet**, klik ikon panah (transfer)
- Pilih dompet asal, dompet tujuan, nominal, dan tanggal
- Saldo kedua dompet akan otomatis ter-update

### 6. **Kelola Budget**
- Buka menu **Budget**, tambahkan budget per kategori
- Lihat progress bar dan status penggunaan budget Anda
- Terima peringatan jika ada kategori yang melebihi 90% budget

### 7. **Pantau Keuangan**
- Dashboard menampilkan total saldo, pemasukan, dan pengeluaran
- Grafik menunjukkan tren pengeluaran 7 hari dan breakdown per kategori
- Gunakan AI untuk bertanya: *"Analisa pengeluaranku bulan ini"*

### 8. **Atur Akun**
- Buka menu Pengaturan (ikon gear di dashboard)
- Ubah nama profil, ganti tema terang/gelap, atau keluar dari akun

## Development

### Scripts Tersedia

```bash
# Development server (dengan hot reload)
npm run dev

# Build untuk production
npm run build

# Jalankan production build
npm start

# Lint code
npm run lint

# Analisis bundle size
npm run analyze
```

### Development Workflow

1. **Create branch baru untuk fitur**
   ```bash
   git checkout -b feature/nama-fitur
   ```

2. **Make changes dan commit**
   ```bash
   git add .
   git commit -m "Add: deskripsi fitur"
   ```

3. **Test locally**
   ```bash
   npm run dev
   ```

4. **Lint & format code**
   ```bash
   npm run lint
   ```

## Build & Deploy

### Build untuk Production
```bash
npm run build
npm start
```

### Deploy ke Vercel (Recommended)
1. Push code ke GitHub
2. Connect repository ke [Vercel](https://vercel.com)
3. Set environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`) di Vercel dashboard
4. Deploy otomatis saat push ke main branch

### Deploy ke Platform Lain
- Heroku
- Railway
- AWS Amplify
- Firebase Hosting
- Docker container

**Docker Example:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Error: "GEMINI_API_KEY tidak dikonfigurasi"
- Pastikan `GEMINI_API_KEY` sudah diisi di `.env.local`
- Gunakan nama variabel yang sama persis tanpa prefix `NEXT_PUBLIC_`
- Restart dev server: `Ctrl+C` kemudian `npm run dev`

### Error: "Cannot find module '@supabase/supabase-js'"
```bash
npm install
npm run dev
```

### Error: "NEXT_PUBLIC_SUPABASE_URL is not set"
- Pastikan `.env.local` sudah dibuat
- Verifikasi value yang benar di Supabase dashboard
- Restart dev server: `Ctrl+C` kemudian `npm run dev`

### AI tidak merespons atau "Gagal memanggil Gemini API"
- Verifikasi API key di [Google AI Studio](https://aistudio.google.com/apikey)
- Pastikan key masih aktif dan kuota/billing mencukupi
- Periksa koneksi internet

### PWA tidak bisa install
- Gunakan HTTPS (localhost:3000 OK untuk development)
- Check `public/manifest.json` sudah ter-setup
- Check `public/sw.js` (Service Worker) valid

### Database connection error
- Pastikan internet connection stabil
- Verifikasi Supabase URL dan anon key
- Check status Supabase service di status page

### Error versi Node.js
- Pastikan menggunakan Node.js >= 20.9.0 (`node -v`)
- Gunakan Node version manager (nvm) jika perlu

## Kontribusi

Kami menyambut kontribusi! Berikut cara berkontribusi:

1. Fork repository
2. Create branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add: AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Coding Standards
- Gunakan TypeScript untuk type safety
- Ikuti ESLint rules
- Tulis commit message yang bermakna
- Test fitur sebelum submit PR

## License

Project ini berada di bawah license [MIT](LICENSE).

## Support & Contact

Untuk pertanyaan atau issues:
- Buka GitHub Issues di repository ini
- Email: [your-email@example.com]

---

**Made with ❤️ for better personal finance management**