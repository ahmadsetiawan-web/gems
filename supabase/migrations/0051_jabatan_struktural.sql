-- Jabatan fungsional/tambahan (mis. "Ketua Tim Kerja Pengembangan Konsep
-- Geosains", "Penanggungjawab Administrasi dan Layanan Sarana
-- Penyelidikan") terpisah dari jabatan PNS formal di kolom `jabatan`
-- yang berasal dari data Excel. Admin isi manual di sini per NIP, dan
-- aplikasi otomatis membacanya -- tidak perlu edit kode lagi kalau ada
-- perubahan nomenklatur.
alter table pegawai add column if not exists jabatan_struktural text;
