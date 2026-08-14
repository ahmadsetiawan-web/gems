-- Catatan hasil pemeriksaan teknisi saat alat dikembalikan
-- (kondisi baik/ada kerusakan, dll) sebelum masuk lagi ke ruang alat.
alter table peminjaman add column if not exists catatan_pengembalian text;
