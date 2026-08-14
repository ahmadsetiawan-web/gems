-- Tambah kolom nama di profiles (dipakai untuk non-pegawai,
-- yang tidak punya referensi nama dari tabel pegawai)
alter table profiles add column if not exists nama text;

-- Update function supaya nama ikut disimpan saat registrasi
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'non_pegawai');
  v_nip text := new.raw_user_meta_data ->> 'nip';
  v_nama text := new.raw_user_meta_data ->> 'nama';
begin
  insert into public.profiles (id, email, role, nip, nama, status_approval)
  values (
    new.id,
    new.email,
    v_role,
    v_nip,
    v_nama,
    case when v_role = 'pegawai' then 'approved' else 'pending' end
  );

  if v_role = 'pegawai' and v_nip is not null then
    update public.pegawai set sudah_terdaftar = true where nip = v_nip;
  end if;

  return new;
end;
$$;
