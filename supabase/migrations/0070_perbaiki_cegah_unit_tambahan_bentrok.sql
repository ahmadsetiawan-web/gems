-- =========================================================
-- Perbaiki cegah_unit_tambahan_bentrok() dari 0066: sebelumnya cuma
-- mengecek unit TAMBAHAN pengajuan yang sedang difinalisasi terhadap
-- unit lain yang sudah aktif -- tidak mengecek unit UTAMA
-- (peminjaman.id_alat) pengajuan itu sendiri terhadap unit_tambahan
-- pengajuan lain.
--
-- Skenario yang lolos sebelumnya: pengajuan kolektif B sudah aktif
-- dengan alat X sebagai unit tambahan. Lalu pengajuan satuan A untuk
-- alat X yang sama difinalisasi -- unique index
-- peminjaman_satu_aktif_per_alat (dari 0066) cuma membandingkan
-- peminjaman.id_alat ke peminjaman.id_alat lain, tidak "melihat" alat X
-- yang tersimpan di peminjaman_unit_tambahan milik B, jadi A lolos dan
-- alat X jadi double-booking.
--
-- Fungsi ini diganti supaya mengecek SELURUH alat yang terlibat di
-- pengajuan yang difinalisasi (unit utama + semua unit tambahan)
-- terhadap SELURUH alat yang sudah diklaim pengajuan lain (juga unit
-- utama + unit tambahan mereka).
-- =========================================================

create or replace function cegah_unit_tambahan_bentrok()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bentrok text;
begin
  if old.status <> 'draft' or new.status = 'draft' then
    return new;
  end if;

  select unit_ini.alat_id into bentrok
  from (
    select new.id_alat as alat_id
    union
    select ut.id_alat
    from peminjaman_unit_tambahan ut
    where ut.peminjaman_id = new.id
  ) unit_ini
  where exists (
    select 1 from peminjaman p2
    where p2.id_alat = unit_ini.alat_id
      and p2.id <> new.id
      and p2.status not in ('draft', 'ditolak', 'dikembalikan')
  )
  or exists (
    select 1 from peminjaman_unit_tambahan ut2
    join peminjaman p3 on p3.id = ut2.peminjaman_id
    where ut2.id_alat = unit_ini.alat_id
      and ut2.peminjaman_id <> new.id
      and p3.status not in ('draft', 'ditolak', 'dikembalikan')
  )
  limit 1;

  if bentrok is not null then
    raise exception 'Unit % sudah diajukan/dipinjam di pengajuan lain', bentrok
      using errcode = '23505';
  end if;

  return new;
end;
$$;
