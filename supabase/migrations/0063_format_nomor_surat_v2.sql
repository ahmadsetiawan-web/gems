-- =========================================================
-- Ubah lagi format nomor Surat Peminjaman Peralatan. Format baru:
-- {urut 2 digit} / 01 / GB / PKPSP / PKPSP / {bulan romawi} / {tahun}
-- Nomor yang sudah terlanjur terbit dengan format lama TIDAK diubah di
-- sini -- kalau ada yang perlu disesuaikan, Admin tinggal pakai tombol
-- Edit di halaman suratnya masing-masing.
--
-- Sequence-nya di-restart ke 1 supaya nomor berikutnya yang terbit
-- persis "01 / 01 / GB / PKPSP / PKPSP / VIII / 2026" (sesuai contoh).
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
    new.nomor_surat := lpad(nextval('nomor_surat_seq')::text, 2, '0')
      || ' / 01 / GB / PKPSP / PKPSP / '
      || bulan_romawi[extract(month from now())::int]
      || ' / ' || extract(year from now())::text;
  end if;
  return new;
end;
$$;

alter sequence nomor_surat_seq restart with 1;
