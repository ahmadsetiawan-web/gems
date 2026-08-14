-- =========================================================
-- Tahap "Disetujui": setelah Pimpinan 1 ACC pengajuan, status TIDAK
-- otomatis jadi 'dipinjam' -- alat perlu dicek & diserahkan dulu oleh
-- Teknisi (atas arahan Pimpinan 2). Status 'disetujui' jadi jembatan:
-- diajukan -> disetujui (ACC Pimpinan 1) -> dipinjam (serah terima
-- Teknisi) -> dikembalikan.
-- =========================================================

-- Perluas check constraint status (dicari dinamis, konsisten dengan
-- migrasi 0039, supaya tidak perlu tebak nama constraint yang ada).
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
  check (status in ('draft', 'diajukan', 'disetujui', 'dipinjam', 'dikembalikan', 'ditolak'));

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
  check (status in ('draft', 'diajukan', 'disetujui', 'dipinjam', 'dikembalikan', 'ditolak'));

-- Kolom baru: identitas Teknisi yang serah-terima alat (cek sebelum
-- diserahkan ke peminjam), terpisah dari dikonfirmasi_oleh (dipakai
-- saat pengembalian).
alter table peminjaman add column if not exists diserahkan_oleh text;
alter table peminjaman add column if not exists diserahkan_oleh_nip text;
alter table peminjaman add column if not exists diserahkan_pada timestamptz;

alter table peminjaman_organik add column if not exists diserahkan_oleh text;
alter table peminjaman_organik add column if not exists diserahkan_oleh_nip text;
alter table peminjaman_organik add column if not exists diserahkan_pada timestamptz;

-- Perluas function bersama (dipakai peminjaman & peminjaman_organik):
-- - diajukan -> disetujui/ditolak: rekam Pimpinan 1 (seperti sebelumnya,
--   cuma sekarang berhenti di 'disetujui', bukan langsung 'dipinjam')
-- - disetujui -> dipinjam: rekam Teknisi yang serah-terima (baru)
-- - dipinjam -> dikembalikan: rekam siapa yang konfirmasi kembali (sudah ada)
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

  if old.status = 'diajukan' and new.status in ('disetujui', 'ditolak') then
    select nama, nip into new.disetujui_oleh, new.disetujui_oleh_nip
    from profiles where id = auth.uid();
    new.disetujui_pada := now();
  end if;

  if old.status = 'disetujui' and new.status = 'dipinjam' then
    select nama, nip into new.diserahkan_oleh, new.diserahkan_oleh_nip
    from profiles where id = auth.uid();
    new.diserahkan_pada := now();
  end if;

  if old.status = 'dipinjam' and new.status = 'dikembalikan' then
    select nama, nip into new.dikonfirmasi_oleh, new.dikonfirmasi_oleh_nip
    from profiles where id = auth.uid();
    new.dikonfirmasi_pada := now();
  end if;

  return new;
end;
$$;

-- Nomor surat sekarang muncul begitu Pimpinan 1 ACC (status 'disetujui'),
-- bukan menunggu sampai 'dipinjam' (yang sekarang baru terjadi setelah
-- Teknisi serah-terima alat).
create or replace function generate_nomor_surat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bulan_romawi text[] := array['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
begin
  if new.status = 'disetujui' and new.nomor_surat is null then
    new.nomor_surat := lpad(nextval('nomor_surat_seq')::text, 3, '0')
      || ' / 01 / 02 / GL / PKPSP / PKPSP / '
      || bulan_romawi[extract(month from now())::int]
      || ' / ' || extract(year from now())::text;
  end if;
  return new;
end;
$$;

-- Stok alat organik berkurang saat benar-benar diserahkan Teknisi
-- (disetujui -> dipinjam), bukan lagi langsung saat diajukan -> dipinjam
-- (transisi itu sudah tidak terjadi langsung lagi).
create or replace function sync_alat_organik_stok()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'disetujui' and new.status = 'dipinjam' then
    update alat_organik
    set jumlah_tersedia = jumlah_tersedia - new.jumlah_diambil
    where id = new.id_alat_organik;
  elsif old.status = 'dipinjam' and new.status = 'dikembalikan' then
    update alat_organik
    set jumlah_tersedia = jumlah_tersedia + new.jumlah_diambil
    where id = new.id_alat_organik;
  end if;
  return new;
end;
$$;

-- status_ketersediaan alat survei: 'disetujui' masih dianggap "Diajukan"
-- (belum resmi keluar), baru jadi "Dipinjam" setelah serah-terima Teknisi.
create or replace function sync_alat_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update alat
  set status_ketersediaan = case new.status
    when 'diajukan' then 'Diajukan'
    when 'disetujui' then 'Diajukan'
    when 'dipinjam' then 'Dipinjam'
    else 'Tersedia'
  end
  where id_alat = new.id_alat;
  return new;
end;
$$;
