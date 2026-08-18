-- =========================================================
-- Bug: jabatan struktural Pimpinan 1/2 tidak muncul di surat cetak
-- saat dilihat oleh Peminjam biasa (padahal muncul normal untuk
-- Admin/Developer). Penyebabnya: RLS tabel pegawai cuma izinkan lihat
-- data milik sendiri (0028) atau kalau Admin (0030) -- padahal surat
-- perlu menampilkan data pegawai MILIK ORANG LAIN (Pimpinan yang
-- menyetujui, Teknisi yang memeriksa, dst), bukan cuma data sendiri.
--
-- Data di tabel pegawai (nama, jabatan, tim kerja) bukan data sensitif
-- -- sama seperti tabel referensi lain di aplikasi ini (alat,
-- jenis_alat, dst) yang memang bisa dilihat semua user yang login.
-- Policy ini ditambahkan (bukan gantikan yang lama) supaya aman dari
-- risiko salah tebak nama policy yang sudah ada.
-- =========================================================

create policy "Authenticated users can view all pegawai data"
  on pegawai for select
  using (auth.uid() is not null);
