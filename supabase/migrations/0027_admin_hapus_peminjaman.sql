-- Izinkan admin menghapus riwayat peminjaman (untuk bersih-bersih data test).
create policy "Admin can delete peminjaman"
  on peminjaman for delete
  using (is_admin());

grant delete on peminjaman to authenticated;
