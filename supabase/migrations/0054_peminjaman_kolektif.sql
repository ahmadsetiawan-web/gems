-- =========================================================
-- Peminjaman kolektif: 1 pengajuan untuk banyak unit ALAT SURVEI
-- sekaligus, sejenis alat (mis. 70 unit "Geobit C100 Landtech
-- Geophysics"). peminjaman.id_alat tetap berarti "unit utama" seperti
-- sebelumnya (peminjaman satuan sama sekali tidak berubah); unit-unit
-- tambahan sebuah pengajuan kolektif disimpan di tabel terpisah ini,
-- kosong/tidak dipakai untuk pengajuan satuan biasa.
--
-- Tidak ada checklist kelengkapan untuk unit tambahan (kolektif
-- melewati sistem centang aksesori per unit sesuai keputusan produk).
-- =========================================================

create table if not exists peminjaman_unit_tambahan (
  id uuid primary key default gen_random_uuid(),
  peminjaman_id uuid not null references peminjaman (id) on delete cascade,
  id_alat text not null references alat (id_alat),
  created_at timestamptz not null default now(),
  unique (peminjaman_id, id_alat)
);

alter table peminjaman_unit_tambahan enable row level security;

-- Sama seperti peminjaman_kelengkapan, tapi ditambah pimpinan2 & teknisi
-- karena unit tambahan perlu tampil di halaman Penugasan Teknisi, Serah
-- Terima, Pengembalian, dan di surat -- bukan cuma Persetujuan.
create policy "View own or admin/pimpinan/teknisi peminjaman_unit_tambahan"
  on peminjaman_unit_tambahan for select
  using (
    exists (
      select 1 from peminjaman p
      where p.id = peminjaman_unit_tambahan.peminjaman_id
        and (
          p.peminjam_id = auth.uid()
          or is_admin() or is_pimpinan() or is_pimpinan2() or is_teknisi()
        )
    )
  );

create policy "Owner can insert peminjaman_unit_tambahan"
  on peminjaman_unit_tambahan for insert
  with check (
    exists (
      select 1 from peminjaman p
      where p.id = peminjaman_unit_tambahan.peminjaman_id
        and p.peminjam_id = auth.uid()
    )
  );

create policy "Owner can delete peminjaman_unit_tambahan while draft"
  on peminjaman_unit_tambahan for delete
  using (
    exists (
      select 1 from peminjaman p
      where p.id = peminjaman_unit_tambahan.peminjaman_id
        and p.peminjam_id = auth.uid() and p.status = 'draft'
    )
  );

grant select, insert, delete on peminjaman_unit_tambahan to authenticated;

-- Perluas sync_alat_status(): unit utama seperti sebelumnya, ditambah
-- semua unit tambahan (kalau ada) ikut status yang sama.
create or replace function sync_alat_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  status_baru text;
begin
  status_baru := case new.status
    when 'diajukan' then 'Diajukan'
    when 'disetujui' then 'Diajukan'
    when 'ditugaskan' then 'Diajukan'
    when 'diperiksa' then 'Diajukan'
    when 'dipinjam' then 'Dipinjam'
    when 'pengembalian_ditugaskan' then 'Dipinjam'
    when 'pengembalian_diperiksa' then 'Dipinjam'
    when 'pengembalian_disetujui' then 'Dipinjam'
    else 'Tersedia'
  end;

  update alat set status_ketersediaan = status_baru
  where id_alat = new.id_alat;

  update alat set status_ketersediaan = status_baru
  where id_alat in (
    select id_alat from peminjaman_unit_tambahan
    where peminjaman_id = new.id
  );

  return new;
end;
$$;
