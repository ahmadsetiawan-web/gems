-- =========================================================
-- Update/tambah data alat contoh (dari Peralatan_Survei.xlsx terbaru,
-- 6 baris). Sebagian unit sudah ada (L&R_525, SUPERSTING_229) -> update;
-- yang belum ada -> ditambahkan baru. status_ketersediaan TIDAK disentuh
-- (dikelola otomatis oleh sistem peminjaman, bukan dari import ini).
-- =========================================================
insert into alat (id_alat, nama_alat, tipe_alat, kode_alat, no_inventaris, tahun_alat, kondisi_alat)
values
('L&R_525', 'Gravimeter LaCoste & Romberg', 'Type G', 'G.525', '3.11.02.02.003.003', 1987, 'Baik'),
('SCINTREXCG6_670', 'Gravimeter Auto Scintrex', 'CG-6', '24120670', '3110202003-17', 2024, 'Baik'),
('MTU5C_725', 'Magnetotellurik Phoenix Geophysics', 'MTU-5C', '10725', '3030317164-2', 2024, 'Baik'),
('GEM_19T_123', 'GEM Magnetometer Systems', 'GSM-19T', '41010123', '3080149018-9', 2024, 'Baik'),
('SUPERSTING_229', 'Induced Polarization', 'Supersting R8/IP', 'SS0410229', '3.11.02.02.020.063', 2004, 'Baik'),
('GEOBITC100_01', 'Geobit C100 Landtech Geophysics', 'Landtech C100', 'L-15001', '3.11.02.02.020.088', 2015, 'Baik')
on conflict (id_alat) do update set
  nama_alat = excluded.nama_alat,
  tipe_alat = excluded.tipe_alat,
  kode_alat = excluded.kode_alat,
  no_inventaris = excluded.no_inventaris,
  tahun_alat = excluded.tahun_alat,
  kondisi_alat = excluded.kondisi_alat;
