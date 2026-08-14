-- =========================================================
-- Tanda tangan elektronik: alih-alih tanda tangan basah/gambar,
-- rekam otomatis nama+NIP (dari profil yang login) dan waktu kejadian
-- di tiap tahap peminjaman, untuk ditampilkan di surat cetak sebagai
-- pengganti kolom tanda tangan.
-- =========================================================

alter table peminjaman add column if not exists diajukan_pada timestamptz;
alter table peminjaman add column if not exists disetujui_oleh_nip text;
alter table peminjaman add column if not exists disetujui_pada timestamptz;
alter table peminjaman add column if not exists dikonfirmasi_oleh text;
alter table peminjaman add column if not exists dikonfirmasi_oleh_nip text;
alter table peminjaman add column if not exists dikonfirmasi_pada timestamptz;

alter table peminjaman_organik add column if not exists diajukan_pada timestamptz;
alter table peminjaman_organik add column if not exists disetujui_oleh_nip text;
alter table peminjaman_organik add column if not exists disetujui_pada timestamptz;
alter table peminjaman_organik add column if not exists dikonfirmasi_oleh text;
alter table peminjaman_organik add column if not exists dikonfirmasi_oleh_nip text;
alter table peminjaman_organik add column if not exists dikonfirmasi_pada timestamptz;

-- Perluas function yang sudah ada (tabel-agnostik, dipakai peminjaman
-- & peminjaman_organik) supaya juga merekam waktu pengajuan peminjam,
-- waktu persetujuan pimpinan, dan identitas+waktu konfirmasi
-- pengembalian oleh admin/teknisi.
create or replace function set_disetujui_oleh()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'diajukan' and old.status is distinct from 'diajukan' then
    new.diajukan_pada := now();
  end if;

  if old.status = 'diajukan' and new.status in ('dipinjam', 'ditolak') then
    select nama, nip into new.disetujui_oleh, new.disetujui_oleh_nip
    from profiles where id = auth.uid();
    new.disetujui_pada := now();
  end if;

  if old.status = 'dipinjam' and new.status = 'dikembalikan' then
    select nama, nip into new.dikonfirmasi_oleh, new.dikonfirmasi_oleh_nip
    from profiles where id = auth.uid();
    new.dikonfirmasi_pada := now();
  end if;

  return new;
end;
$$;
