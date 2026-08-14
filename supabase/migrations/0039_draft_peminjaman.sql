-- =========================================================
-- Status "draft" untuk peminjaman (alat survei & organik): peminjam
-- bisa simpan isian + checklist kelengkapan dulu tanpa langsung
-- mengajukan, kembali edit kapan saja, baru klik "Ajukan Peminjaman"
-- saat benar-benar siap. Draft belum mengunci alat / mengurangi stok
-- (baru terjadi saat status pindah ke 'diajukan'/'dipinjam').
-- =========================================================

-- Ganti check constraint kolom status supaya menerima 'draft', apa pun
-- nama constraint-nya saat ini (dicari dinamis, bukan tebak nama).
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'peminjaman'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%in%'
  loop
    execute format('alter table peminjaman drop constraint %I', con.conname);
  end loop;
end $$;

alter table peminjaman add constraint peminjaman_status_check
  check (status in ('draft', 'diajukan', 'dipinjam', 'dikembalikan', 'ditolak'));

do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'peminjaman_organik'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%in%'
  loop
    execute format('alter table peminjaman_organik drop constraint %I', con.conname);
  end loop;
end $$;

alter table peminjaman_organik add constraint peminjaman_organik_status_check
  check (status in ('draft', 'diajukan', 'dipinjam', 'dikembalikan', 'ditolak'));

-- Pemilik draft boleh ubah field-nya sendiri selama masih berstatus
-- draft, termasuk transisi draft -> diajukan (tombol "Ajukan Peminjaman"),
-- dan boleh hapus draft miliknya sendiri.
create policy "Owner can update own draft peminjaman"
  on peminjaman for update
  using (peminjam_id = auth.uid() and status = 'draft')
  with check (peminjam_id = auth.uid() and status in ('draft', 'diajukan'));

create policy "Owner can delete own draft peminjaman"
  on peminjaman for delete
  using (peminjam_id = auth.uid() and status = 'draft');

create policy "Owner can update own draft peminjaman_organik"
  on peminjaman_organik for update
  using (peminjam_id = auth.uid() and status = 'draft')
  with check (peminjam_id = auth.uid() and status in ('draft', 'diajukan'));

create policy "Owner can delete own draft peminjaman_organik"
  on peminjaman_organik for delete
  using (peminjam_id = auth.uid() and status = 'draft');

grant delete on peminjaman to authenticated;
grant delete on peminjaman_organik to authenticated;

-- Checklist kelengkapan alat survei: pemilik boleh ubah/hapus baris
-- selama peminjaman induknya masih draft (dipakai saat "Simpan
-- Perubahan" menyusun ulang daftar kelengkapan yang dicentang).
create policy "Owner can update peminjaman_kelengkapan while draft"
  on peminjaman_kelengkapan for update
  using (
    exists (
      select 1 from peminjaman p
      where p.id = peminjaman_kelengkapan.peminjaman_id
        and p.peminjam_id = auth.uid() and p.status = 'draft'
    )
  );

create policy "Owner can delete peminjaman_kelengkapan while draft"
  on peminjaman_kelengkapan for delete
  using (
    exists (
      select 1 from peminjaman p
      where p.id = peminjaman_kelengkapan.peminjaman_id
        and p.peminjam_id = auth.uid() and p.status = 'draft'
    )
  );

grant update, delete on peminjaman_kelengkapan to authenticated;
