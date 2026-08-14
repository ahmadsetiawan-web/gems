-- =========================================================
-- Perbaikan: infinite recursion pada RLS policy profiles.
-- Policy yang mengecek "apakah saya admin/pimpinan/approved" dengan
-- query langsung ke tabel profiles menyebabkan Postgres mengevaluasi
-- policy profiles secara berulang tanpa henti. Solusinya: bungkus
-- pengecekan itu dalam function SECURITY DEFINER, yang mengakses
-- tabel profiles TANPA melewati RLS lagi (tidak recursive).
-- =========================================================
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

create or replace function is_pimpinan()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_pimpinan from profiles where id = auth.uid()), false);
$$;

create or replace function is_approved()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select status_approval = 'approved' from profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function is_admin() to authenticated, anon;
grant execute on function is_pimpinan() to authenticated, anon;
grant execute on function is_approved() to authenticated, anon;

-- Ganti semua policy yang tadinya query langsung ke profiles,
-- supaya pakai function di atas.

drop policy if exists "Admin/pimpinan can view all profiles" on profiles;
create policy "Admin/pimpinan can view all profiles"
  on profiles for select
  using (is_admin() or is_pimpinan());

drop policy if exists "Admins can manage alat" on alat;
create policy "Admins can manage alat"
  on alat for all
  using (is_admin());

drop policy if exists "View own peminjaman, admin/pimpinan view all" on peminjaman;
create policy "View own peminjaman, admin/pimpinan view all"
  on peminjaman for select
  using (peminjam_id = auth.uid() or is_admin() or is_pimpinan());

drop policy if exists "Approved users can request peminjaman" on peminjaman;
create policy "Approved users can request peminjaman"
  on peminjaman for insert
  with check (peminjam_id = auth.uid() and is_approved());

drop policy if exists "Admin/pimpinan can update peminjaman" on peminjaman;
create policy "Admin/pimpinan can update peminjaman"
  on peminjaman for update
  using (is_admin() or is_pimpinan());
