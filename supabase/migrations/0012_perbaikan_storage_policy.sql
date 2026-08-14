-- Perbaikan: policy storage.objects (upload/update/delete file alat) masih
-- mengecek role = 'admin' versi lama (migrasi 0006), padahal sejak migrasi
-- 0008 admin dipindah ke kolom is_admin. Ganti ke function is_admin()
-- (dibuat di migrasi 0010) supaya konsisten dan tidak mati langkah.
drop policy if exists "Admin can upload alat files" on storage.objects;
drop policy if exists "Admin can update alat files" on storage.objects;
drop policy if exists "Admin can delete alat files" on storage.objects;

create policy "Admin can upload alat files"
on storage.objects for insert
with check (bucket_id = 'alat' and is_admin());

create policy "Admin can update alat files"
on storage.objects for update
using (bucket_id = 'alat' and is_admin());

create policy "Admin can delete alat files"
on storage.objects for delete
using (bucket_id = 'alat' and is_admin());
