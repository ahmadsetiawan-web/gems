-- =========================================================
-- Perketat akses update Teknisi ke peminjaman/peminjaman_organik.
--
-- Policy lama ("Teknisi can update peminjaman"/"..._organik" dari
-- 0042_role_teknisi.sql) cuma mengecek is_teknisi(), tanpa membatasi ke
-- baris yang memang ditugaskan ke Teknisi itu. Akibatnya secara teknis
-- (lewat client Supabase langsung, bukan lewat tampilan aplikasi) satu
-- akun Teknisi bisa mengubah peminjaman siapa pun -- termasuk melompati
-- persetujuan Pimpinan/Pimpinan 2 milik orang lain.
--
-- Kebijakan lain yang sudah ditambahkan setelahnya (peminjaman_kelengkapan
-- di 0048, peminjaman_kelengkapan_kembali di 0055) sudah benar membatasi
-- ke `ditugaskan_ke = auth.uid()` -- migrasi ini menyamakan dua policy
-- lama yang terlewat supaya konsisten.
-- =========================================================

drop policy if exists "Teknisi can update peminjaman" on peminjaman;

create policy "Teknisi can update assigned peminjaman"
  on peminjaman for update
  using (is_teknisi() and ditugaskan_ke = auth.uid())
  with check (is_teknisi() and ditugaskan_ke = auth.uid());

drop policy if exists "Teknisi can update peminjaman_organik" on peminjaman_organik;

create policy "Teknisi can update assigned peminjaman_organik"
  on peminjaman_organik for update
  using (is_teknisi() and ditugaskan_ke = auth.uid())
  with check (is_teknisi() and ditugaskan_ke = auth.uid());
