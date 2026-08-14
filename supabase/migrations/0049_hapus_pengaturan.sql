-- Tabel pengaturan (nama/NIP Pimpinan 2) jadi redundan sekarang --
-- role is_pimpinan2 di Kelola Pengguna sudah jadi satu-satunya sumber
-- kebenaran untuk siapa Pimpinan 2. Surat cetak langsung ambil dari
-- profiles where is_pimpinan2 = true.
drop table if exists pengaturan;
