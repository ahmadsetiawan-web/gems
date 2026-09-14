-- =========================================================
-- Perbaiki 0065_perketat_rls_teknisi.sql: policy itu terlalu ketat.
--
-- Halaman "Pengembalian Alat" (/pengembalian, /pengembalian-organik)
-- sengaja bisa diakses SEMUA akun Teknisi (bukan cuma yang ditugaskan),
-- lihat Navbar.tsx `{(isAdmin || isTeknisi) && ...}` dan query di
-- page.tsx yang menampilkan SEMUA baris berstatus
-- 'pengembalian_disetujui' tanpa filter ditugaskan_ke -- desainnya
-- memang "siapa saja Teknisi yang available boleh konfirmasi kembali
-- alat yang sudah di-ACC Pimpinan 2", bukan cuma Teknisi yang tadinya
-- ditugaskan meriksa.
--
-- Policy 0065 kemarin cuma mengizinkan ditugaskan_ke = auth.uid(),
-- jadi tanpa perbaikan ini Teknisi selain yang ditugaskan akan gagal
-- (diam-diam, 0 baris ter-update) saat klik "Konfirmasi Kembali" untuk
-- alat yang bukan tugas dia.
-- =========================================================

drop policy if exists "Teknisi can update assigned peminjaman" on peminjaman;

create policy "Teknisi can update assigned peminjaman"
  on peminjaman for update
  using (
    is_teknisi()
    and (ditugaskan_ke = auth.uid() or status = 'pengembalian_disetujui')
  )
  with check (is_teknisi());

drop policy if exists "Teknisi can update assigned peminjaman_organik" on peminjaman_organik;

create policy "Teknisi can update assigned peminjaman_organik"
  on peminjaman_organik for update
  using (
    is_teknisi()
    and (ditugaskan_ke = auth.uid() or status = 'pengembalian_disetujui')
  )
  with check (is_teknisi());
