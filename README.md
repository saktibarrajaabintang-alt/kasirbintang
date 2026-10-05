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

3. Setup database MySQL / MariaDB di lokal
4. Import file `database.sql` ke HeidiSQL atau MySQL client
5. Salin `.env.example` menjadi `.env.local` lalu sesuaikan koneksi database
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

## Catatan penting

- `.env` tidak disarankan untuk dipublish ke GitHub
- Aplikasi ini menyediakan fallback demo state ketika database tidak terhubung, tetapi schema SQL siap dipakai di MySQL / MariaDB
- Untuk environment production, isi `DATABASE_URL` dengan koneksi database yang valid
