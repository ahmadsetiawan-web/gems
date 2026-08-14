-- =========================================================
-- Nomor surat peminjaman, dibuat otomatis saat pimpinan menyetujui
-- (status berubah jadi 'dipinjam'). Format:
-- {urut 3 digit} / 01 / 02 / GL / PKPSP / PKPSP / {bulan romawi} / {tahun}
-- Penomoran terus lanjut (tidak reset tiap tahun).
-- =========================================================
alter table peminjaman add column if not exists nomor_surat text;

create sequence if not exists nomor_surat_seq;

create or replace function generate_nomor_surat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bulan_romawi text[] := array['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
begin
  if new.status = 'dipinjam' and new.nomor_surat is null then
    new.nomor_surat := lpad(nextval('nomor_surat_seq')::text, 3, '0')
      || ' / 01 / 02 / GL / PKPSP / PKPSP / '
      || bulan_romawi[extract(month from now())::int]
      || ' / ' || extract(year from now())::text;
  end if;
  return new;
end;
$$;

create trigger on_peminjaman_generate_nomor_surat
  before update of status on peminjaman
  for each row execute procedure generate_nomor_surat();

-- Admin perlu bisa lihat data pegawai siapa saja (misal tim_kerja)
-- untuk keperluan cetak surat peminjaman, bukan cuma data sendiri.
create policy "Admin can view all pegawai data"
  on pegawai for select
  using (is_admin());
