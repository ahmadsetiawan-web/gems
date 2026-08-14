-- Catatan tambahan dari peminjam saat mengajukan (misal: rincian
-- kelengkapan yang dibawa tapi tidak ada di daftar kelengkapan_alat),
-- ditampilkan langsung di baris "Catatan tambahan" pada surat cetak.
alter table peminjaman add column if not exists catatan_tambahan text;
