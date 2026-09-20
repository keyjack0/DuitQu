# Changelog

Semua perubahan penting pada DuitQu didokumentasikan di file ini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/).

## [1.3.0] - 2026-09-20

### Baru
- Financial Goals dengan target, nominal terkumpul, tenggat, ikon, warna, dan progres
- Kalender keuangan bulanan dengan indikator dan detail transaksi harian
- Laporan bulanan dengan perbandingan periode, arus kas mingguan, kategori teratas, dan ekspor PDF
- Onboarding empat langkah pada kunjungan pertama halaman login
- Ekspor data akun ke JSON dengan pagination untuk dataset besar
- Detail dompet dengan arus kas, distribusi kategori, dan aktivitas terbaru

### AI Assistant
- Ringkasan saldo, arus kas, budget, goals, dan transaksi terbaru sebagai konteks percakapan
- Quick actions yang menyesuaikan kondisi keuangan pengguna
- Draft transaksi dari bahasa natural dengan form review sebelum disimpan
- Dukungan retry, stop, error state, dan pagination riwayat percakapan

### Profil dan Privasi
- Desain ulang halaman Profil dan Pengaturan
- Tema sistem, terang, dan gelap
- Ubah nama profil dan kata sandi
- Status verifikasi email, ekspor data, dan penghapusan riwayat AI
- Logout yang hanya membersihkan state lokal setelah Supabase mengonfirmasi keberhasilan

### Peningkatan
- Pencarian dan filter transaksi berbasis server dengan pagination stabil
- Grafik pengeluaran dapat dipilih untuk periode 7, 14, atau 30 hari
- Edit budget, transfer dompet, serta loading, empty, dan retry state yang lebih jelas
- Mutasi transaksi dan Goals kini menunggu konfirmasi database serta rollback saat gagal
- Aksesibilitas dialog, keyboard navigation, focus state, dan layout responsif ditingkatkan
- Service worker hanya menyimpan aset statis; navigasi dan data finansial tetap network-only

### Dokumentasi
- Migration database khusus untuk upgrade ke 1.3.0
- Penjelasan data yang dikirim ke Google Gemini
- Dokumentasi PWA, route, setup, quality checks, dan deployment diperbarui
- Lisensi MIT ditambahkan

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
- Dashboard keuangan dengan grafik
- Manajemen multi-dompet & transfer antar dompet
- Pencatatan transaksi, budget per kategori, AI Assistant (Gemini)
- Progressive Web App (PWA) yang dapat dipasang pada perangkat yang mendukung
