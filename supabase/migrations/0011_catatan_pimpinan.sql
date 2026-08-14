-- Ganti alasan_penolakan (khusus tolak) jadi catatan_pimpinan
-- (dipakai baik untuk Setujui maupun Tolak) - satu kolom, lebih fleksibel.
alter table peminjaman add column if not exists catatan_pimpinan text;
alter table peminjaman drop column if exists alasan_penolakan;
