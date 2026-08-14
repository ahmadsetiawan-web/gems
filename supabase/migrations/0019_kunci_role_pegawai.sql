-- Hapus akun test non-pegawai yang tersisa dari percobaan sebelumnya.
-- Menghapus dari auth.users otomatis ikut menghapus baris profiles-nya
-- (relasi ON DELETE CASCADE).
delete from auth.users where email like 'gems.test.verifikasi%';

-- Kunci role: aplikasi ini sekarang khusus pegawai saja.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role = 'pegawai');
