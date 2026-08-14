-- Izinkan pegawai update foto_url miliknya sendiri juga (selain tim_kerja)
grant update (foto_url) on pegawai to authenticated;

-- =========================================================
-- Storage bucket untuk foto profil pegawai.
-- Publik untuk dibaca, tapi upload/ubah hanya boleh untuk foto milik
-- sendiri (path harus diawali NIP pegawai yang login).
-- =========================================================
insert into storage.buckets (id, name, public)
values ('pegawai', 'pegawai', true)
on conflict (id) do nothing;

create policy "Public can view foto pegawai"
on storage.objects for select
using (bucket_id = 'pegawai');

create policy "Users can upload own foto pegawai"
on storage.objects for insert
with check (
  bucket_id = 'pegawai'
  and name like 'foto/' || (select nip from profiles where id = auth.uid()) || '.%'
);

create policy "Users can update own foto pegawai"
on storage.objects for update
using (
  bucket_id = 'pegawai'
  and name like 'foto/' || (select nip from profiles where id = auth.uid()) || '.%'
);
