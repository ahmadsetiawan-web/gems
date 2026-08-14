-- =========================================================
-- Tabel referensi data pegawai (diimpor dari Excel)
-- =========================================================
create table if not exists pegawai (
  nip text primary key,
  nama text not null,
  golongan text,
  tmt_golongan date,
  jabatan text,
  foto_url text,
  sudah_terdaftar boolean not null default false,
  created_at timestamptz not null default now()
);

-- Kunci tabel ini: tidak bisa diakses langsung dari luar.
-- Akses hanya lewat function check_nip() di bawah.
alter table pegawai enable row level security;

-- =========================================================
-- Tabel profil akun (terhubung ke sistem login Supabase Auth)
-- =========================================================
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null check (role in ('pegawai', 'non_pegawai', 'admin')),
  nip text references pegawai (nip),
  status_approval text not null default 'pending'
    check (status_approval in ('approved', 'pending', 'rejected')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- User hanya boleh melihat profil miliknya sendiri
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- =========================================================
-- Function: cek apakah NIP valid & belum dipakai daftar
-- Dipanggil dari form registrasi SEBELUM user login,
-- makanya tabel pegawai dikunci tapi function ini boleh diakses publik.
-- =========================================================
create or replace function check_nip(input_nip text)
returns table (nama text, jabatan text, valid boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select p.nama, p.jabatan, (not p.sudah_terdaftar) as valid
  from pegawai p
  where p.nip = input_nip;
end;
$$;

grant execute on function check_nip(text) to anon, authenticated;

-- =========================================================
-- Trigger: otomatis buat baris profiles saat ada user baru daftar,
-- dan tandai NIP sebagai "sudah_terdaftar" kalau dia pegawai.
-- Data role & nip dikirim dari aplikasi saat proses signUp.
-- =========================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'non_pegawai');
  v_nip text := new.raw_user_meta_data ->> 'nip';
begin
  insert into public.profiles (id, email, role, nip, status_approval)
  values (
    new.id,
    new.email,
    v_role,
    v_nip,
    case when v_role = 'pegawai' then 'approved' else 'pending' end
  );

  if v_role = 'pegawai' and v_nip is not null then
    update public.pegawai set sudah_terdaftar = true where nip = v_nip;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =========================================================
-- Data contoh (2 baris dari Excel, untuk testing)
-- =========================================================
insert into pegawai (nip, nama, golongan, tmt_golongan, jabatan)
values
  ('198701102014021003', 'Ahmad Setiawan, S.Si., M.T.', 'III/d', '2023-10-01', 'Penyelidik Bumi Ahli Muda'),
  ('196702221992031002', 'Asep Rusnandi', 'III/c', '2020-04-01', 'Teknisi Litkayasa Penyelia')
on conflict (nip) do nothing;
