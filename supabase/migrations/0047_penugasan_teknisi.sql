-- =========================================================
-- Alur lengkap serah terima: setelah Pimpinan 1 ACC (status
-- 'disetujui'), Pimpinan 2 MENUNJUK satu Teknisi tertentu untuk
-- memeriksa alat (status 'ditugaskan'). Teknisi yang ditunjuk
-- memeriksa lalu konfirmasi selesai (status 'diperiksa'). Pimpinan 2
-- lalu ACC hasil pemeriksaan (status 'dipinjam' -- alat resmi keluar)
-- atau minta cek ulang (balik ke 'ditugaskan', Teknisi yang sama).
--
-- disetujui -> ditugaskan -> diperiksa -> dipinjam
--                   ^_______________|
--            (Pimpinan 2 minta cek ulang)
-- =========================================================

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
  check (status in ('draft', 'diajukan', 'disetujui', 'ditugaskan', 'diperiksa', 'dipinjam', 'dikembalikan', 'ditolak'));

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
  check (status in ('draft', 'diajukan', 'disetujui', 'ditugaskan', 'diperiksa', 'dipinjam', 'dikembalikan', 'ditolak'));

-- Kolom baru: siapa yang ditunjuk (teknisi), siapa yang menunjuk
-- (Pimpinan 2), catatan hasil pemeriksaan Teknisi, dan ACC/catatan
-- Pimpinan 2.
alter table peminjaman add column if not exists ditugaskan_ke uuid references profiles (id);
alter table peminjaman add column if not exists ditugaskan_oleh text;
alter table peminjaman add column if not exists ditugaskan_oleh_nip text;
alter table peminjaman add column if not exists ditugaskan_pada timestamptz;
alter table peminjaman add column if not exists catatan_pemeriksaan_teknisi text;
alter table peminjaman add column if not exists disetujui2_oleh text;
alter table peminjaman add column if not exists disetujui2_oleh_nip text;
alter table peminjaman add column if not exists disetujui2_pada timestamptz;
alter table peminjaman add column if not exists catatan_pimpinan2 text;

alter table peminjaman_organik add column if not exists ditugaskan_ke uuid references profiles (id);
alter table peminjaman_organik add column if not exists ditugaskan_oleh text;
alter table peminjaman_organik add column if not exists ditugaskan_oleh_nip text;
alter table peminjaman_organik add column if not exists ditugaskan_pada timestamptz;
alter table peminjaman_organik add column if not exists catatan_pemeriksaan_teknisi text;
alter table peminjaman_organik add column if not exists disetujui2_oleh text;
alter table peminjaman_organik add column if not exists disetujui2_oleh_nip text;
alter table peminjaman_organik add column if not exists disetujui2_pada timestamptz;
alter table peminjaman_organik add column if not exists catatan_pimpinan2 text;

-- Perluas function bersama (dipakai peminjaman & peminjaman_organik).
-- diserahkan_oleh/nip/pada sekarang direkam saat Teknisi menyelesaikan
-- pemeriksaan (ditugaskan -> diperiksa), bukan lagi saat serah terima
-- langsung -- ini tetap identitas Teknisi yang benar-benar cek alat,
-- yang tampil di blok "Teknisi Peralatan" pada surat.
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

  if old.status = 'disetujui' and new.status = 'ditugaskan' then
    select nama, nip into new.ditugaskan_oleh, new.ditugaskan_oleh_nip
    from profiles where id = auth.uid();
    new.ditugaskan_pada := now();
  end if;

  if old.status = 'ditugaskan' and new.status = 'diperiksa' then
    select nama, nip into new.diserahkan_oleh, new.diserahkan_oleh_nip
    from profiles where id = auth.uid();
    new.diserahkan_pada := now();
  end if;

  if old.status = 'diperiksa' and new.status = 'dipinjam' then
    select nama, nip into new.disetujui2_oleh, new.disetujui2_oleh_nip
    from profiles where id = auth.uid();
    new.disetujui2_pada := now();
  end if;

  if old.status = 'dipinjam' and new.status = 'dikembalikan' then
    select nama, nip into new.dikonfirmasi_oleh, new.dikonfirmasi_oleh_nip
    from profiles where id = auth.uid();
    new.dikonfirmasi_pada := now();
  end if;

  return new;
end;
$$;

-- status_ketersediaan alat survei: semua tahap sebelum 'dipinjam' masih
-- dianggap "Diajukan" (belum resmi keluar).
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
    when 'ditugaskan' then 'Diajukan'
    when 'diperiksa' then 'Diajukan'
    when 'dipinjam' then 'Dipinjam'
    else 'Tersedia'
  end
  where id_alat = new.id_alat;
  return new;
end;
$$;

-- Stok alat organik berkurang setelah Pimpinan 2 ACC hasil pemeriksaan
-- (diperiksa -> dipinjam), bukan lagi di 'disetujui -> dipinjam'.
create or replace function sync_alat_organik_stok()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'diperiksa' and new.status = 'dipinjam' then
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
