-- =========================================================
-- Storage bucket untuk file alat (foto, manual, dokumen)
-- Bucket bersifat publik untuk dibaca (foto alat tidak rahasia),
-- tapi upload/ubah/hapus hanya boleh admin.
-- =========================================================
insert into storage.buckets (id, name, public)
values ('alat', 'alat', true)
on conflict (id) do nothing;

create policy "Public can view alat files"
on storage.objects for select
using (bucket_id = 'alat');

create policy "Admin can upload alat files"
on storage.objects for insert
with check (
  bucket_id = 'alat'
  and exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

create policy "Admin can update alat files"
on storage.objects for update
using (
  bucket_id = 'alat'
  and exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

create policy "Admin can delete alat files"
on storage.objects for delete
using (
  bucket_id = 'alat'
  and exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
