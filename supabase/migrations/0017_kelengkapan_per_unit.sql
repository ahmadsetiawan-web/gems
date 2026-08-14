-- =========================================================
-- Pindahkan kelengkapan_alat dari level jenis (nama_alat) ke level
-- unit fisik (id_alat) — kelengkapan dengan nomor inventaris spesifik
-- itu milik 1 unit tertentu, bukan berlaku umum untuk semua unit sejenis.
-- =========================================================
alter table kelengkapan_alat add column if not exists id_alat text references alat (id_alat);

update kelengkapan_alat set id_alat = 'SUPERSTING_229' where nama_alat = 'Induced Polarization';

alter table kelengkapan_alat alter column id_alat set not null;
alter table kelengkapan_alat drop column if exists nama_alat;
