# DuitQu 💰

Aplikasi manajemen keuangan pribadi berbasis web (PWA) dengan AI assistant yang cerdas. Kelola dompet, transaksi, budget, dan lihat insight keuangan Anda secara real-time, dimana saja dan kapan saja.

## 📋 Daftar Isi
- [Tentang Project](#tentang-project)
- [Fitur Utama](#fitur-utama)
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

## 🎯 Tentang Project

**DuitQu** adalah aplikasi web modern untuk manajemen keuangan pribadi yang dirancang dengan user experience terbaik. Aplikasi ini dilengkapi dengan:

- 💾 Progressive Web App (PWA) - bisa digunakan offline
- 🤖 AI Assistant yang memahami perintah natural language
- 📊 Dashboard analytics dengan visualisasi interaktif
- 🏦 Multi-wallet management untuk berbagai akun/dompet
- 💳 Budget tracking per kategori pengeluaran
- 📱 Responsive design - bekerja sempurna di desktop, tablet, dan mobile

Sempurna untuk individu yang ingin mengontrol keuangan pribadi mereka dengan lebih baik dan membuat keputusan finansial yang lebih informed.

## ✨ Fitur Utama

### 1. **Dashboard Keuangan Real-time** 📊
- Melihat ringkasan keuangan keseluruhan
- Grafik pengeluaran vs pemasukan
- Statistik per kategori transaksi
- Widget informasi cepat (total balance, pengeluaran bulan ini, dsb)

### 2. **Multi-Wallet Management** 🏦
- Kelola multiple wallets/akun
- Track balance setiap wallet secara terpisah
- Transfer antar wallet
- Tentukan wallet default untuk transaksi

### 3. **AI Assistant Cerdas** 🤖
- Input transaksi menggunakan natural language
- Contoh: "beli kopi di kafe 50 ribu", "transfer ke tabungan 500rb"
- AI memahami konteks dan kategori otomatis
- Chat interface yang user-friendly

### 4. **Manajemen Transaksi** 💸
- Catat transaksi dengan detail lengkap
- Kategori transaksi yang fleksibel (makanan, transportasi, hiburan, dll)
- Filter dan search transaksi
- Edit/hapus transaksi yang sudah tercatat
- Lampirkan catatan atau note pada transaksi

### 5. **Budget Tracking** 📈
- Set budget limit per kategori
- Monitor pengeluaran vs budget
- Alert ketika mendekati atau melampaui budget
- Progress visualization per kategori

### 6. **Progressive Web App (PWA)** 📱
- Install aplikasi langsung di smartphone/tablet
- Bekerja offline (cached data)
- Push notifications untuk reminders
- Icon di home screen seperti native app

## 🛠 Tech Stack

| Aspek | Teknologi | Versi |
|-------|-----------|-------|
| **Frontend Framework** | Next.js | 16.2.6 |
| **React Version** | React | 19.2.4 |
| **Styling** | Tailwind CSS | 4 |
| **UI Components** | Radix UI | Latest |
| **State Management** | Zustand | 5.0.14 |
| **Backend/Database** | Supabase (PostgreSQL) | - |
| **AI Integration** | Claude AI (Anthropic) | - |
| **Charts & Graphs** | Recharts | 3.8.1 |
| **PWA** | next-pwa | 5.6.0 |
| **Date Handling** | date-fns | 4.3.0 |
| **Icons** | Lucide React | 1.17.0 |
| **Notifications** | React Toastify | 11.1.0 |
| **Form Utilities** | clsx, tailwind-merge | Latest |
| **Type Checking** | TypeScript | 5 |
| **Linting** | ESLint | 9 |

## 📦 Persyaratan Sistem

- **Node.js** >= 18.x
- **npm** >= 9.x atau **yarn** >= 3.x
- **Browser modern** dengan support PWA:
  - Chrome/Chromium 40+
  - Firefox 44+
  - Safari 15.1+
  - Edge 17+

## 🚀 Instalasi

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

## 🔧 Setup Environment

### 1. Setup Supabase

**Step 1: Buat Project Supabase**
1. Kunjungi [supabase.com](https://supabase.com)
2. Login atau daftar akun baru
3. Klik "New Project"
4. Isi nama project dan password
5. Tunggu project selesai di-create

**Step 2: Setup Database Schema**
1. Masuk ke Supabase Dashboard
2. Buka "SQL Editor"
3. Buat query baru
4. Copy-paste isi dari file `supabase-schema.sql`
5. Jalankan query dengan klik tombol "Run"

**Step 3: Ambil Credentials**
1. Buka "Settings" → "API"
2. Copy "Project URL" dan "anon public" key
3. Simpan untuk step berikutnya

### 2. Setup Environment Variables

**Create `.env.local` file di root project:**
```bash
# Copy template jika ada
cp .env.example .env.local
```

**Isi file `.env.local`:**
```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Claude AI API
NEXT_PUBLIC_CLAUDE_API_KEY=your_claude_api_key
```

**Cara mendapatkan Claude API Key:**
1. Kunjungi [console.anthropic.com](https://console.anthropic.com)
2. Login atau daftar akun
3. Buka "API Keys"
4. Klik "Create Key"
5. Copy dan simpan di `.env.local`

### 3. Verifikasi Setup
```bash
npm run dev
```

Buka http://localhost:3000 di browser. Jika berhasil, Anda akan melihat halaman login.

## 📁 Struktur Project

```
duitqu/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── ai/
│   │       └── route.ts          # AI Assistant endpoint
│   ├── auth/                     # Authentication pages
│   ├── dashboard/                # Dashboard page
│   ├── transactions/             # Transactions management
│   ├── wallets/                  # Wallet management
│   ├── budgets/                  # Budget tracking
│   ├── ai-assistant/             # AI chat interface
│   ├── settings/                 # User settings
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (redirect to dashboard)
│   └── globals.css               # Global styles
│
├── components/                   # Reusable React components
│   ├── layout/                   # Layout components
│   │   ├── AppLayout.tsx         # Main app layout wrapper
│   │   └── BottomNav.tsx         # Mobile bottom navigation
│   ├── dashboard/                # Dashboard specific components
│   ├── transactions/             # Transaction components
│   │   ├── AddTransactionModal.tsx
│   │   └── LazyAddTransactionModal.tsx
│   ├── wallets/                  # Wallet components
│   ├── budgets/                  # Budget components
│   ├── ai/                       # AI Assistant components
│   ├── ui/                       # Reusable UI components
│   │   ├── ConfirmDialog.tsx     # Confirmation dialog
│   │   └── ... (other UI components)
│   ├── DataInitializer.tsx       # Initialize demo data
│   └── ExpenseChart.tsx          # Expense visualization
│
├── hooks/                        # Custom React hooks
│
├── lib/                          # Utility functions & libraries
│   ├── supabase.ts               # Supabase client setup
│   ├── store.ts                  # Zustand store (state management)
│   ├── demo-data.ts              # Demo data untuk testing
│   ├── icons.tsx                 # Icon definitions
│   ├── utils.ts                  # Utility functions
│   └── ...
│
├── types/                        # TypeScript type definitions
│   └── index.ts                  # Global type exports
│
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service Worker
│   ├── icons/                    # App icons
│   └── ...
│
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.mjs             # ESLint configuration
├── postcss.config.mjs            # PostCSS configuration
├── package.json                  # Project dependencies
└── README.md                     # This file
```

## 💻 Penggunaan

### 1. **Akses Aplikasi**
```bash
npm run dev
```
Buka http://localhost:3000

### 2. **Login/Register**
- Gunakan email dan password untuk register akun baru
- Password akan di-hash untuk keamanan

### 3. **Setup Wallet Pertama**
- Setelah login, setup wallet/akun keuangan Anda
- Tentukan nama, currency, dan initial balance

### 4. **Catat Transaksi**
- Gunakan "Add Transaction" button
- Isi detail: amount, category, description, date
- Atau gunakan AI Assistant dengan ketik natural language

### 5. **Monitor Budget**
- Set budget limit per kategori
- Lihat progress bar dan alert notifications

### 6. **Lihat Analytics**
- Dashboard menampilkan overview keuangan
- Chart menunjukkan trend spending
- Breakdown per kategori

## 🔨 Development

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

## 🏗 Build & Deploy

### Build untuk Production
```bash
npm run build
npm start
```

### Deploy ke Vercel (Recommended)
1. Push code ke GitHub
2. Connect repository ke [Vercel](https://vercel.com)
3. Set environment variables di Vercel dashboard
4. Deploy otomatis saat push ke main branch

### Deploy ke Platform Lain
- Heroku
- Railway
- AWS Amplify
- Firebase Hosting
- Docker container

**Docker Example:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🆘 Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"
```bash
npm install
npm run dev
```

### Error: "NEXT_PUBLIC_SUPABASE_URL is not set"
- Pastikan `.env.local` sudah dibuat
- Verifikasi value yang benar di Supabase dashboard
- Restart dev server: `Ctrl+C` kemudian `npm run dev`

### Error: "AI API key is invalid"
- Verifikasi API key di console.anthropic.com
- Pastikan key belum expired atau disabled
- Check billing status di Anthropic dashboard

### PWA tidak bisa install
- Gunakan HTTPS (localhost:3000 OK untuk development)
- Check `public/manifest.json` sudah ter-setup
- Check `public/sw.js` (Service Worker) valid

### Database connection error
- Pastikan internet connection stabil
- Verifikasi Supabase URL dan anon key
- Check status Supabase service di status page

## 🤝 Kontribusi

Kami welcome contributions! Berikut cara berkontribusi:

1. Fork repository
2. Create branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add: AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Coding Standards
- Use TypeScript untuk type safety
- Follow ESLint rules
- Write meaningful commit messages
- Test fitur sebelum submit PR

## 📄 License

Project ini berada di bawah license [MIT](LICENSE).

## 📞 Support & Contact

Untuk pertanyaan atau issues:
- Buka GitHub Issues di repository ini
- Email: [your-email@example.com]

---

**Made with ❤️ for better personal finance management**
