-- Policy "Admins can manage alat" di database ternyata masih pakai
-- pengecekan lama (profiles.is_admin = true) alih-alih function
-- is_admin() (yang juga mengizinkan is_developer). Akibatnya akun
-- developer (is_admin = false, is_developer = true) tidak bisa
-- UPDATE/INSERT/DELETE tabel alat — row tidak error, tapi 0 baris
-- kena update. Pasang ulang policy supaya konsisten dengan migrasi 0010.
drop policy if exists "Admins can manage alat" on alat;
create policy "Admins can manage alat"
  on alat for all
  using (is_admin());
