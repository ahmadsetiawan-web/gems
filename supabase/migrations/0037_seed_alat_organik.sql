-- Data contoh alat organik (dari Peralatan_Organik.xlsx).
-- Jumlah diisi default 1, admin bisa sesuaikan lewat Kelola Alat Organik.
insert into alat_organik (nama_alat, jumlah_total, jumlah_tersedia)
values
('Palu Geologi (Beku)', 1, 1),
('Palu Geologi (Sedimen)', 1, 1),
('Lup', 1, 1),
('Kamera', 1, 1),
('Tustel', 1, 1),
('Kompas Geologi', 1, 1),
('GPS Handheld', 1, 1)
on conflict (nama_alat) do nothing;
