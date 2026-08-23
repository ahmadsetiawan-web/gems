# GEMS — Geophysical Equipment Management System

Aplikasi peminjaman dan pengembalian peralatan survei geofisika serta
peralatan organik, dipakai di lingkungan Badan Geologi, Pusat Survei
Geologi, Kementerian ESDM. Alur kerja: pengajuan peminjaman → persetujuan
Pimpinan 1 → penugasan & pemeriksaan Teknisi → persetujuan Pimpinan 2 →
konfirmasi pengembalian Admin, dengan surat elektronik diterbitkan
otomatis di tiap tahap.

## Teknologi

- **Next.js** 16 (App Router) + React 19 + TypeScript, styling Tailwind CSS.
- **Supabase** — database Postgres, autentikasi, dan penyimpanan file
  (foto alat, buku manual, tanda tangan elektronik, dll).
- Node.js **20.9 atau lebih baru** dibutuhkan untuk menjalankan/build.

## Yang perlu disiapkan untuk deploy

### 1. Akses kode sumber

Kode ada di repo GitHub `ahmadsetiawan-web/gems` (branch `master`). Beri
akun IT akses sebagai collaborator ke repo ini, atau pindahkan
kepemilikan repo ke organisasi kantor.

### 2. Environment variable

Aplikasi butuh 2 variabel (lihat `.env.example`), didapat dari dashboard
proyek Supabase (Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Ini kunci publik (anon key), bukan kunci rahasia — tapi tetap sebaiknya
diberikan lewat kanal yang aman (bukan chat terbuka), dan IT yang
mengisikannya di pengaturan hosting, bukan meng-commit ke repo.

### 3. Database Supabase

Skema database ada di `supabase/migrations/` (file `.sql` bernomor urut,
saat ini 64 file). Dua pilihan untuk IT:

- **Pindah kepemilikan proyek Supabase yang sudah ada** — paling
  sederhana, semua data, tabel, RLS policy, dan file storage yang sudah
  ada langsung ikut pindah tanpa perlu menjalankan ulang migrasi.
- **Bikin proyek Supabase baru** — jalankan semua file di
  `supabase/migrations/` secara berurutan (0001 sampai file terakhir)
  lewat SQL Editor Supabase. Kalau pilih ini, **file yang sudah
  diunggah ke Storage (foto alat, PDF buku manual, tanda tangan
  elektronik) tidak ikut pindah otomatis** — perlu diunduh dari proyek
  lama lalu diunggah ulang manual ke proyek baru.

### 4. Hosting & domain

Belum ditentukan di proyek ini — perlu didiskusikan dengan IT: mau
dihost di Vercel, atau di server internal kantor? Apakah sudah ada
domain/subdomain resmi yang akan dipakai?

### 5. Yang TIDAK perlu dikirim

Folder `doc_tambahan/` di root proyek berisi berkas kerja pribadi (foto,
dokumen referensi, file Excel yang sedang terbuka) — bukan bagian dari
aplikasi, jangan ikut disertakan ke IT.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Butuh file
`.env.local` berisi 2 variabel di atas (lihat `.env.example`).

## Build produksi

```bash
npm run build
npm run start
```
