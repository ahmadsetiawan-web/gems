-- =========================================================
-- Teknisi & Pimpinan 2 perlu bisa lihat checklist kelengkapan alat
-- (sebelumnya cuma pemilik pengajuan/admin/pimpinan yang bisa).
-- Teknisi juga perlu bisa PERBAIKI checklist (centang/qty) untuk
-- tugas yang ditunjuk ke dirinya, selama masih tahap pemeriksaan.
-- =========================================================

create policy "Teknisi can view peminjaman_kelengkapan"
  on peminjaman_kelengkapan for select
  using (is_teknisi());

create policy "Pimpinan2 can view peminjaman_kelengkapan"
  on peminjaman_kelengkapan for select
  using (is_pimpinan2());

create policy "Teknisi can insert peminjaman_kelengkapan while assigned"
  on peminjaman_kelengkapan for insert
  with check (
    exists (
      select 1 from peminjaman p
      where p.id = peminjaman_kelengkapan.peminjaman_id
        and p.ditugaskan_ke = auth.uid() and p.status = 'ditugaskan'
    )
  );

create policy "Teknisi can update peminjaman_kelengkapan while assigned"
  on peminjaman_kelengkapan for update
  using (
    exists (
      select 1 from peminjaman p
      where p.id = peminjaman_kelengkapan.peminjaman_id
        and p.ditugaskan_ke = auth.uid() and p.status = 'ditugaskan'
    )
  );

create policy "Teknisi can delete peminjaman_kelengkapan while assigned"
  on peminjaman_kelengkapan for delete
  using (
    exists (
      select 1 from peminjaman p
      where p.id = peminjaman_kelengkapan.peminjaman_id
        and p.ditugaskan_ke = auth.uid() and p.status = 'ditugaskan'
    )
  );
