-- =========================================================
-- Izin hapus riwayat peminjaman untuk Admin sebelumnya cuma pernah
-- dibuat untuk Alat Survei (migrasi 0027) -- Alat Organik terlewat,
-- jadi tombol Hapus di Riwayat Pengembalian Organik & Status
-- Peminjaman diam-diam gagal (RLS menolak, tanpa error) untuk baris
-- peminjaman_organik.
-- =========================================================

create policy "Admin can delete peminjaman_organik"
  on peminjaman_organik for delete
  using (is_admin());
