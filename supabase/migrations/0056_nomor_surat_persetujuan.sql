-- =========================================================
-- Nomor surat untuk Surat Persetujuan Peminjaman, dibuat otomatis saat
-- Pimpinan 1 menyetujui (status berubah jadi 'disetujui'). Format:
-- {urut 2 digit} / {bulan angka 2 digit} / BGS.GS / {tahun}
-- Beda dari nomor_surat (Surat Peminjaman): nomor ini RESET ke 01
-- setiap awal tahun baru, makanya urutannya dihitung dari tabel
-- counter per tahun (bukan sequence biasa yang jalan terus).
-- =========================================================

alter table peminjaman add column if not exists nomor_surat_persetujuan text;

-- Tabel counter kecil, 1 baris per tahun. Tidak diberi grant/RLS ke
-- authenticated sama sekali -- cuma disentuh lewat function SECURITY
-- DEFINER di bawah, jadi user biasa tidak bisa baca/ubah langsung.
create table if not exists nomor_surat_persetujuan_counter (
  tahun int primary key,
  urut int not null default 0
);

create or replace function generate_nomor_surat_persetujuan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tahun_ini int := extract(year from now())::int;
  urut_baru int;
begin
  if new.status = 'disetujui' and new.nomor_surat_persetujuan is null then
    insert into nomor_surat_persetujuan_counter (tahun, urut)
    values (tahun_ini, 1)
    on conflict (tahun) do update
      set urut = nomor_surat_persetujuan_counter.urut + 1
    returning urut into urut_baru;

    new.nomor_surat_persetujuan := lpad(urut_baru::text, 2, '0')
      || '/' || lpad(extract(month from now())::int::text, 2, '0')
      || '/BGS.GS/' || tahun_ini::text;
  end if;
  return new;
end;
$$;

create trigger on_peminjaman_generate_nomor_surat_persetujuan
  before update of status on peminjaman
  for each row execute procedure generate_nomor_surat_persetujuan();
