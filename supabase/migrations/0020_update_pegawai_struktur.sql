-- Data master pegawai terbaru tidak lagi menyertakan TMT Golongan,
-- tapi menambahkan Status Pegawai (PNS/PPPK/PPPK-PW).
alter table pegawai alter column tmt_golongan drop not null;
alter table pegawai add column if not exists status_pegawai text;
