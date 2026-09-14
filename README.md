# GEMS — Geophysical Equipment Management System

Aplikasi peminjaman dan pengembalian peralatan survei geofisika serta
peralatan organik, dipakai di lingkungan Badan Geologi, Pusat Survei
Geologi, Kementerian ESDM.

## Alur kerja

Peminjaman dan pengembalian sama-sama lewat siklus Teknisi →
Pimpinan 2 — bukan cuma sekali, tapi dua kali (satu saat meminjamkan,
satu lagi saat menerima kembali):

**Saat meminjamkan:**
1. Pegawai mengajukan peminjaman
2. Pimpinan 1 menyetujui atau menolak pengajuan
3. Pimpinan 2 menugaskan Teknisi untuk menyiapkan & memeriksa alat
4. Teknisi memeriksa alat, isi checklist kelengkapan
5. Pimpinan 2 menyetujui hasil pemeriksaan (atau minta Teknisi cek ulang)
6. Alat resmi berstatus "Dipinjam"

**Saat pengembalian** (setelah alat dipakai & dikembalikan secara fisik):
7. Pimpinan 2 menugaskan Teknisi untuk memeriksa kondisi alat yang kembali
8. Teknisi memeriksa kondisi & kelengkapan yang kembali
9. Pimpinan 2 menyetujui hasil pemeriksaan pengembalian (atau minta cek ulang)
10. Admin mengonfirmasi pengembalian final

Surat elektronik diterbitkan otomatis di tiap tahap persetujuan.

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
saat ini 70 file). Dua pilihan untuk IT:

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

Sudah diputuskan: **server internal kantor (Linux)**, bukan Vercel.
Yang perlu disiapkan di server:

| Kebutuhan | Pilihan konkret |
|---|---|
| Runtime | Node.js 20 LTS (via `nvm` atau paket resmi NodeSource) |
| Process manager | `pm2` (`pm2 start npm --name gems -- start`, lalu `pm2 startup` supaya otomatis jalan lagi saat server reboot) |
| Reverse proxy | Nginx — terima request di port 80/443, teruskan ke `localhost:3000` |
| HTTPS | Certbot (Let's Encrypt) kalau domain bisa diverifikasi keluar, atau sertifikat internal kantor kalau intranet-only |
| Firewall | Buka port 80/443 masuk; izinkan port 443 **keluar** ke `*.supabase.co` (database tetap di Supabase Cloud, server ini hanya menjalankan aplikasinya) |
| Git | `git` terinstall di server untuk `git pull` saat ada update kode |

Domain/subdomain internal yang akan dipakai (mis. `gems.esdm.local`)
masih perlu didaftarkan di DNS internal kantor oleh IT — belum
ditentukan namanya di sini.

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
