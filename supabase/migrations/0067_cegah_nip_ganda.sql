-- =========================================================
-- Cegah dua akun terdaftar dengan NIP yang sama.
--
-- check_nip() (0001_pegawai_dan_profiles.sql) cuma mengecek
-- pegawai.sudah_terdaftar, yang baru di-set true di dalam
-- handle_new_user() -- SETELAH akun auth.users selesai dibuat. Kalau ada
-- dua proses signUp untuk NIP yang sama nyaris bersamaan (mis. double
-- klik tombol Daftar), keduanya bisa lolos check_nip() sebelum salah
-- satu trigger sempat jalan, menghasilkan dua akun berbeda untuk satu
-- NIP yang sama.
--
-- CATATAN sebelum menjalankan migrasi ini: kalau kebetulan sudah ada
-- data lama dengan NIP dobel di profiles, pembuatan constraint ini akan
-- gagal -- itu tandanya perlu dibereskan manual dulu (hapus/gabung akun
-- duplikat) sebelum migrasi ini bisa jalan.
-- =========================================================

alter table profiles add constraint profiles_nip_unique unique (nip);
