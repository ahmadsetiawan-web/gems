-- =========================================================
-- Nomor surat untuk Alat Organik (Surat Persetujuan & Surat
-- Peminjaman) -- terpisah dari nomor Alat Survei (counter/sequence
-- sendiri), supaya urutannya tidak tercampur antar 2 jenis alat.
-- Formatnya sama seperti versi Alat Survei.
-- =========================================================

-- ---------------------------------------------------------
-- Surat Persetujuan Peminjaman (Organik): otomatis saat Pimpinan 1
-- setuju, format {urut 2 digit}/{bulan angka 2 digit}/BGS.GS/{tahun},
-- reset ke 01 tiap awal tahun.
-- ---------------------------------------------------------

alter table peminjaman_organik add column if not exists nomor_surat_persetujuan text;

create table if not exists nomor_surat_persetujuan_organik_counter (
  tahun int primary key,
  urut int not null default 0
);

create or replace function generate_nomor_surat_persetujuan_organik()
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
    insert into nomor_surat_persetujuan_organik_counter (tahun, urut)
    values (tahun_ini, 1)
    on conflict (tahun) do update
      set urut = nomor_surat_persetujuan_organik_counter.urut + 1
    returning urut into urut_baru;

    new.nomor_surat_persetujuan := lpad(urut_baru::text, 2, '0')
      || '/' || lpad(extract(month from now())::int::text, 2, '0')
      || '/BGS.GS/' || tahun_ini::text;
  end if;
  return new;
end;
$$;

create trigger on_peminjaman_organik_generate_nomor_surat_persetujuan
  before update of status on peminjaman_organik
  for each row execute procedure generate_nomor_surat_persetujuan_organik();

do $$
begin
  alter table peminjaman_organik
    add constraint peminjaman_organik_nomor_surat_persetujuan_key
    unique (nomor_surat_persetujuan);
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------
-- Surat Peminjaman Peralatan (Organik): otomatis saat Pimpinan 2 ACC
-- (status jadi 'dipinjam'), format
-- {urut 3 digit} / 01 / 02 / GL / PKPSP / {bulan romawi} / {tahun},
-- penomoran terus lanjut (tidak reset tiap tahun).
-- ---------------------------------------------------------

alter table peminjaman_organik add column if not exists nomor_surat text;

create sequence if not exists nomor_surat_organik_seq;

create or replace function generate_nomor_surat_organik()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bulan_romawi text[] := array['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
begin
  if new.status = 'dipinjam' and new.nomor_surat is null then
    new.nomor_surat := lpad(nextval('nomor_surat_organik_seq')::text, 3, '0')
      || ' / 01 / 02 / GL / PKPSP / '
      || bulan_romawi[extract(month from now())::int]
      || ' / ' || extract(year from now())::text;
  end if;
  return new;
end;
$$;

create trigger on_peminjaman_organik_generate_nomor_surat
  before update of status on peminjaman_organik
  for each row execute procedure generate_nomor_surat_organik();
