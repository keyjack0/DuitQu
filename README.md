# DuitQu 💰

Aplikasi keuangan pribadi berbasis web (PWA) dengan AI assistant.

## Quick Start
```bash
npm install
cp .env.example .env.local  # isi credentials Supabase
npm run dev
```
Buka http://localhost:3000

## Setup Supabase
1. Buat project di supabase.com
2. Jalankan supabase-schema.sql di SQL Editor
3. Copy URL & anon key ke .env.local

## Fitur
- Dashboard keuangan real-time
- Multi-wallet management
- AI Assistant (ketik transaksi natural: "beli kopi 50rb")
- Budget tracker per kategori
- PWA - install di HP!

## Tech Stack
Next.js 15 | Tailwind CSS | Supabase | Claude AI | Recharts | Zustand
