-- =========================================================
-- Role "Teknisi": petugas lapangan yang memeriksa & mengonfirmasi
-- pengembalian alat, terpisah dari admin (yang urus data/persetujuan).
-- Beda dari admin/pimpinan yang di-hardcode lewat NIP, role ini diatur
-- lewat halaman "Kelola Pengguna" karena bisa banyak orang dan sering
-- berganti.
--
-- Catatan: policy baru di sini SENGAJA ditambahkan sebagai policy baru
-- yang berdiri sendiri (bukan drop+recreate policy lama), supaya tidak
-- perlu menebak nama persis policy yang sudah ada di database (lihat
-- kasus drift RLS sebelumnya). Postgres otomatis meng-OR-kan semua
-- policy permissive untuk perintah yang sama.
-- =========================================================

alter table profiles add column if not exists is_teknisi boolean not null default false;

create or replace function is_teknisi()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_teknisi or is_developer from profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function is_teknisi() to authenticated, anon;

-- Teknisi perlu lihat semua profil (nama peminjam), semua peminjaman,
-- dan boleh update peminjaman (dipakai saat konfirmasi pengembalian).
create policy "Teknisi can view all profiles"
  on profiles for select
  using (is_teknisi());

create policy "Teknisi can view all peminjaman"
  on peminjaman for select
  using (is_teknisi());

create policy "Teknisi can update peminjaman"
  on peminjaman for update
  using (is_teknisi());

create policy "Teknisi can view all peminjaman_organik"
  on peminjaman_organik for select
  using (is_teknisi());

create policy "Teknisi can update peminjaman_organik"
  on peminjaman_organik for update
  using (is_teknisi());

-- Admin boleh ubah data profil siapa pun (dipakai halaman Kelola
-- Pengguna untuk centang/lepas role admin/pimpinan/teknisi).
grant update on profiles to authenticated;

create policy "Admin can update any profile"
  on profiles for update
  using (is_admin());

-- Seed role teknisi untuk NIP yang sudah ditentukan. Kalau ada NIP yang
-- belum pernah daftar akun, tinggal dicentang lewat Kelola Pengguna
-- begitu orangnya sudah daftar.
update profiles set is_teknisi = true
where nip in (
  '198209282025211041',
  '197801282025211048',
  '198701082025211054',
  '197705112008112001',
  '198201082025212027',
  '198506292009101001',
  '196907101992031002'
);
