-- =========================================================
-- Ubah format nomor Surat Peminjaman Peralatan -- hapus satu segmen
-- "PKPSP" yang dobel. Format baru:
-- {urut 3 digit} / 01 / 02 / GL / PKPSP / {bulan romawi} / {tahun}
-- Penomoran tetap terus lanjut (tidak reset tiap tahun), pakai
-- sequence yang sama (nomor_surat_seq) dari migrasi 0030.
-- =========================================================

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
      || ' / 01 / 02 / GL / PKPSP / '
      || bulan_romawi[extract(month from now())::int]
      || ' / ' || extract(year from now())::text;
  end if;
  return new;
end;
$$;
