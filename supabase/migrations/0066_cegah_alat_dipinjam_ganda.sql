-- =========================================================
-- Cegah dua pengajuan aktif untuk unit ALAT (survei) yang sama.
--
-- Sebelumnya ketersediaan cuma dicek di form (browser) saat mengajukan
-- -- kalau dua orang mengajukan unit yang sama nyaris bersamaan, keduanya
-- bisa lolos sampai status "diajukan" tersimpan berbarengan (mirip kasus
-- stok Alat Organik yang sudah dicegah di 0059_cegah_stok_organik_minus.sql,
-- tapi di sana lewat jumlah_tersedia, sedangkan alat survei satuan ini
-- lewat status per baris peminjaman).
--
-- CATATAN sebelum menjalankan migrasi ini: kalau ada data lama yang
-- kebetulan sudah bentrok (dua peminjaman aktif untuk id_alat yang sama),
-- pembuatan unique index di bawah akan gagal dengan error -- itu tandanya
-- data itu perlu dibereskan manual dulu (mis. tolak/selesaikan salah
-- satunya) sebelum migrasi ini bisa jalan.
-- =========================================================

create unique index if not exists peminjaman_satu_aktif_per_alat
  on peminjaman (id_alat)
  where status not in ('draft', 'ditolak', 'dikembalikan');

-- Peminjaman kolektif (0054_peminjaman_kolektif.sql) menyimpan unit
-- tambahan di tabel terpisah peminjaman_unit_tambahan -- unique index di
-- atas cuma melindungi unit utama (peminjaman.id_alat), jadi unit
-- tambahan perlu dicek lewat trigger saat pengajuan difinalisasi (status
-- draft -> diajukan), bukan lewat constraint biasa.
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

  select ut.id_alat into bentrok
  from peminjaman_unit_tambahan ut
  where ut.peminjaman_id = new.id
    and (
      exists (
        select 1 from peminjaman p2
        where p2.id_alat = ut.id_alat
          and p2.id <> new.id
          and p2.status not in ('draft', 'ditolak', 'dikembalikan')
      )
      or exists (
        select 1 from peminjaman_unit_tambahan ut2
        join peminjaman p3 on p3.id = ut2.peminjaman_id
        where ut2.id_alat = ut.id_alat
          and ut2.peminjaman_id <> new.id
          and p3.status not in ('draft', 'ditolak', 'dikembalikan')
      )
    )
  limit 1;

  if bentrok is not null then
    raise exception 'Unit % sudah diajukan/dipinjam di pengajuan lain', bentrok
      using errcode = '23505';
  end if;

  return new;
end;
$$;

drop trigger if exists cegah_unit_tambahan_bentrok_trigger on peminjaman;

create trigger cegah_unit_tambahan_bentrok_trigger
  before update on peminjaman
  for each row
  execute function cegah_unit_tambahan_bentrok();
