-- =========================================================
-- Status "developer": akses penuh ke fitur admin & pimpinan
-- (untuk pembuat/pengelola aplikasi), terpisah dari status admin/
-- pimpinan yang merepresentasikan jabatan sungguhan.
-- =========================================================
alter table profiles add column if not exists is_developer boolean not null default false;

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin or is_developer from profiles where id = auth.uid()),
    false
  );
$$;

create or replace function is_pimpinan()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_pimpinan or is_developer from profiles where id = auth.uid()),
    false
  );
$$;

-- Akun pembuat aplikasi: jadi developer, status admin/pimpinan "asli"
-- dilepas supaya tidak tercampur dengan jabatan sungguhan.
update profiles
set is_developer = true, is_admin = false, is_pimpinan = false
where nip = '198701102014021003';
