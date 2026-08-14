-- Saat NIP tertentu daftar, otomatis diberi status admin/pimpinan
-- tanpa perlu langkah SQL manual terpisah.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'pegawai');
  v_nip text := new.raw_user_meta_data ->> 'nip';
  v_nama text := new.raw_user_meta_data ->> 'nama';
  v_is_admin boolean := v_nip in ('198201082025212027');
  v_is_pimpinan boolean := v_nip in ('198010112005021001');
begin
  insert into public.profiles (id, email, role, nip, nama, status_approval, is_admin, is_pimpinan)
  values (
    new.id,
    new.email,
    v_role,
    v_nip,
    v_nama,
    case when v_role = 'pegawai' then 'approved' else 'pending' end,
    v_is_admin,
    v_is_pimpinan
  );

  if v_role = 'pegawai' and v_nip is not null then
    update public.pegawai set sudah_terdaftar = true where nip = v_nip;
  end if;

  return new;
end;
$$;
