-- Perbaikan: tabel yang dibuat lewat SQL Editor tidak otomatis dapat izin
-- akses dasar untuk role 'authenticated' (beda dengan tabel yang dibuat
-- lewat tombol "New Table" di dashboard). RLS policy saja tidak cukup -
-- role harus punya izin dasar ini dulu sebelum RLS bisa dievaluasi.

grant select on profiles to authenticated;
grant select, insert, update, delete on alat to authenticated;
