-- =========================================================
-- Role "Pimpinan 2" (Penanggungjawab Administrasi dan Layanan Sarana
-- Penyelidikan): menunjuk Teknisi untuk memeriksa alat sebelum serah
-- terima, dan ACC hasil pemeriksaan Teknisi sebelum status jadi
-- "Dipinjam". Terpisah dari Pimpinan 1 (is_pimpinan, yang ACC pengajuan
-- awal). Diatur lewat Kelola Pengguna, sama seperti role lain.
-- =========================================================

alter table profiles add column if not exists is_pimpinan2 boolean not null default false;

create or replace function is_pimpinan2()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_pimpinan2 or is_developer from profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function is_pimpinan2() to authenticated, anon;

create policy "Pimpinan2 can view all profiles"
  on profiles for select
  using (is_pimpinan2());

create policy "Pimpinan2 can view all peminjaman"
  on peminjaman for select
  using (is_pimpinan2());

create policy "Pimpinan2 can update peminjaman"
  on peminjaman for update
  using (is_pimpinan2());

create policy "Pimpinan2 can view all peminjaman_organik"
  on peminjaman_organik for select
  using (is_pimpinan2());

create policy "Pimpinan2 can update peminjaman_organik"
  on peminjaman_organik for update
  using (is_pimpinan2());
