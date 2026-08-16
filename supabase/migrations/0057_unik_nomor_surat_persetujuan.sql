-- =========================================================
-- Nomor Surat Persetujuan otomatis sudah pasti berurutan (dihasilkan
-- dari counter yang naik 1 tiap dipakai, lihat migrasi 0056). Satu-
-- satunya cara nomornya bisa jadi tidak berurutan/bentrok adalah lewat
-- tombol Edit manual -- constraint unique ini mencegah dua peminjaman
-- kebetulan/salah ketik dipakaikan nomor yang sama.
--
-- Aman untuk banyak baris NULL (Postgres tidak menganggap NULL = NULL
-- di constraint unique), jadi peminjaman yang belum disetujui/belum
-- punya nomor tidak kena constraint ini.
-- =========================================================

do $$
begin
  alter table peminjaman
    add constraint peminjaman_nomor_surat_persetujuan_key
    unique (nomor_surat_persetujuan);
exception
  when duplicate_object then null;
end $$;
