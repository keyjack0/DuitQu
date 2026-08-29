# Changelog

Semua perubahan penting pada DuitQu didokumentasikan di file ini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/).

## [0.3.0] - 2026-08-29

### Desain
- UI didesain ulang lebih minimalis & modern
- Seluruh card, dialog, sheet, input: border dihapus, rounded corner 24px
- Shadow seragam `0 4px 12px rgba(0,0,0,0.06)` di semua komponen
- Bottom navigation: border diganti shadow, active state pakai dot indicator
- Skeleton loading dengan shimmer animation

### Ikon
- Ikon transaksi & dompet kini berwarna sesuai kategori (mengikuti pie chart)
- Background ikon dompet mengikuti warna ikon (12% opacity)
- Background ikon transaksi mengikuti warna kategori (12% opacity)
- Icon strokeWidth ditingkatkan menjadi 3px

### Fitur
- Optimasi loading halaman transaksi (compare card pakai data store)
- Dashboard balance card: tampilkan pemasukan & pengeluaran mingguan
- Riwayat update tersedia di halaman Pengaturan

### Perbaikan
- Konsistensi CSS di seluruh halaman
- Background input konsisten pakai `bg-primary`
- Berbagai bug fix & cleanup code

## [0.2.0] - 2026-08-22

### Perbaikan
- Edit dompet kini tersimpan dengan benar ke database
- Notifikasi sukses/gagal kini akurat (muncul setelah data benar-benar tersimpan)

### Baru
- Pesan AI Assistant mendukung format teks tebal, miring, kode, dan daftar
- Dialog "Apa yang baru?" muncul otomatis setelah ada pembaruan versi

### Lainnya
- Padding atas halaman Wallets, Transactions, Budgets, dan Settings dirapikan

## [0.1.0]

### Rilis awal
- Dashboard keuangan real-time dengan grafik
- Manajemen multi-dompet & transfer antar dompet
- Pencatatan transaksi, budget per kategori, AI Assistant (Gemini)
- Progressive Web App (PWA) — bisa dipasang & berjalan offline
