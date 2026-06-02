# Media Flip Book Informasi Layanan — Rutan Kelas IIA Balikpapan

Website informasi layanan **kunjungan** dan **titipan barang** dalam bentuk
*flip book* (efek buka halaman buku). Pengunjung memindai QR code di dinding,
lalu membaca panduan langsung dari HP. Petugas dapat login untuk mengunggah
panduan dan melihat statistik akses.

Proyek aktualisasi CPNS — dirancang sederhana, rapi, dan mudah dijelaskan.

## Tautan

- 🌐 **Website (live):** <https://flipbook-rutan-balikpapan.vercel.app>
- 🔐 **Login petugas:** <https://flipbook-rutan-balikpapan.vercel.app/admin/login>
- 💻 **Repository:** <https://github.com/ENDUGI1/flipbook-rutan-balikpapan>

> Deploy **otomatis**: setiap `git push` ke branch `main` akan langsung
> di-build & dipublikasikan oleh Vercel (tidak perlu menjalankan perintah deploy
> manual).

## Teknologi

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** (warna navy `#1F3864`, emas `#F4A21E`)
- **Supabase** — database, autentikasi, dan storage
- **react-pageflip** + **react-pdf** — render PDF menjadi flip book
- **Recharts** — grafik tren akses harian
- Deploy ke **Vercel**

## Struktur Singkat

```
src/
  app/
    page.tsx              Halaman publik (grid panduan + flip book)
    admin/
      login/page.tsx      Login petugas (Supabase Auth)
      page.tsx            Dashboard (statistik + kelola panduan)
  lib/
    supabase/             Client browser, server, & middleware auth
    types.ts              Tipe data
  middleware.ts           Proteksi route /admin
supabase/
  migrations/0001_init.sql   Skema tabel + RLS + Storage policy
public/                   Logo & foto (kementerian, BerAKHLAK, gedung rutan)
```

## Setup Lokal

1. **Pasang dependensi**

   ```bash
   npm install
   ```

2. **Siapkan environment variable**

   Salin `.env.example` menjadi `.env.local`, lalu isi dari
   Supabase Dashboard → *Project Settings* → *API*:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. **Jalankan migration database**

   Buka Supabase Dashboard → *SQL Editor* → tempel isi
   `supabase/migrations/0001_init.sql` → **Run**.
   Ini membuat tabel, menyalakan RLS, dan membuat bucket Storage
   `panduan-pdf`.

4. **Buat akun petugas (admin)**

   - Buat user di Supabase Dashboard → *Authentication* → *Add user*
     (isi email + password).
   - Jadikan user tersebut admin lewat *SQL Editor*:

     ```sql
     update public.profiles set role = 'admin'
     where email = 'email-petugas@contoh.go.id';
     ```

5. **Jalankan aplikasi**

   ```bash
   npm run dev
   ```

   - Halaman publik: <http://localhost:3000>
   - Login petugas: <http://localhost:3000/admin/login>

## Keamanan (Row Level Security)

RLS aktif di **semua** tabel:

| Peran | Hak akses |
|-------|-----------|
| **Pengunjung (anonim)** | Membaca panduan yang `is_active = true`; mencatat akses (`INSERT` ke `akses_log`). Tidak bisa membaca `profiles` dan tidak bisa mengubah apa pun. |
| **Admin (login, `role='admin'`)** | Akses penuh: CRUD panduan, membaca semua `akses_log` & `profiles`. |

Storage bucket `panduan-pdf`: **publik boleh baca**, **hanya admin boleh
upload/ubah/hapus**.

Seluruh kunci Supabase diambil dari environment variable — tidak ada yang
ditulis langsung (hardcode) di kode.

## Data Dummy untuk Pengujian

PDF panduan asli belum tersedia. Untuk menguji flip book, unggah PDF apa saja
(mis. PDF jurnal) lewat dashboard admin. Cover dibuat otomatis dari halaman
pertama PDF. Saat panduan asli sudah ada, **cukup ganti file lewat dashboard
admin — tidak perlu mengubah kode.**

## Deploy ke Vercel

1. Push project ini ke repository GitHub.
2. Di [vercel.com](https://vercel.com) → *Add New Project* → import repo.
3. Tambahkan Environment Variables (sama seperti `.env.local`):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Klik **Deploy**.

## Catatan QR Code

QR code di dinding **jangan** diarahkan langsung ke URL `*.vercel.app`.
Sebaiknya arahkan ke **domain atau redirect yang Anda kontrol sendiri**
(mis. `https://panduan.rutanbalikpapan.go.id` atau layanan short-link
instansi). Dengan begitu, jika hosting berpindah, cukup ubah tujuan
redirect — **QR yang sudah dicetak dan ditempel tidak perlu dicetak ulang.**

Simpan URL publik final di variabel `NEXT_PUBLIC_SITE_URL` (lihat
`.env.example`) untuk dokumentasi.
