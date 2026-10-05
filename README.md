# Tekno Citra Negara Business Center

Aplikasi POS / kasir profesional untuk Business Center jurusan TJKT SMK Citra Negara. Project ini dibangun dengan Next.js App Router, TypeScript, Tailwind CSS, dan didesain agar terasa seperti software kasir bisnis yang siap digunakan, bukan template dashboard umum.

## Tech stack

- Next.js 16
- App Router
- TypeScript
- Tailwind CSS
- React 19
- Lucide React
- MySQL / MariaDB (schema dalam database.sql)

## Fitur utama

- Login admin & kasir dengan role protection
- Dashboard admin dan kasir
- POS transaksi dengan cart, member, checkout, dan pembayaran tunai / QRIS / debit
- CRUD produk
- Manajemen stok
- CRUD member
- Riwayat transaksi
- Laporan keuangan
- Manajemen akun kasir
- Pengaturan profil

## Setup cepat

1. Pastikan Node.js sudah terinstall
2. Jalankan dependency install:

```bash
npm install
```

3. Isi `DATABASE_URL` di `.env.local` dengan URL MySQL, misalnya koneksi dari Railway, dan atur `SESSION_SECRET` memakai nilai acak minimal 32 karakter
4. Tabel `users`, `products`, `members`, dan `transactions` dibuat otomatis saat aplikasi pertama kali terhubung. Jika database kosong, state lokal `.data/app-state.json` akan dipindahkan ke MySQL; jika file itu tidak ada, data demo akan digunakan.
5. Alternatifnya, pilih database target di phpMyAdmin lalu import `database.sql` untuk membuat tabel dan sample data
6. Jalankan project:

```bash
npm run dev
```

## Akun demo

- Admin: `admin` / `admin123`
- Kasir: `kasir` / `kasir123`

## Database

File `database.sql` berisi schema untuk 4 tabel utama:

- users
- products
- members
- transactions

## Environment

Contoh file environment tersedia di `.env.example`.
Untuk deployment di Vercel, tambahkan `DATABASE_URL` (URL koneksi MySQL Railway) dan `SESSION_SECRET` (nilai acak rahasia minimal 32 karakter) di **Project Settings → Environment Variables** untuk environment yang dipakai, lalu redeploy. Jangan gunakan nilai contoh dari `.env.example` untuk `SESSION_SECRET`.

## Catatan penting

- `.env` tidak disarankan untuk dipublish ke GitHub
- Jangan commit `.env.local` atau membagikan `DATABASE_URL`; URL berisi kredensial database
- Saat MySQL tidak tersedia, aplikasi mencatat error dan masih dapat memakai data lokal sementara
