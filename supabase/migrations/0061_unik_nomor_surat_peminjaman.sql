-- =========================================================
-- Lengkapi perlindungan nomor dobel: migrasi 0057 baru menjamin nomor
-- Surat Persetujuan tidak bisa dobel, tapi nomor Surat Peminjaman
-- (nomor_surat) -- yang juga jadi rujukan Surat Pengantar Barang &
-- Surat Pengembalian -- belum dijamin sama sekali, untuk Alat Survei
-- maupun Alat Organik.
-- =========================================================

do $$
begin
  alter table peminjaman
    add constraint peminjaman_nomor_surat_key
    unique (nomor_surat);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table peminjaman_organik
    add constraint peminjaman_organik_nomor_surat_key
    unique (nomor_surat);
exception
  when duplicate_object then null;
end $$;
