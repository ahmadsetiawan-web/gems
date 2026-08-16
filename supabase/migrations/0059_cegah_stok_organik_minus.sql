-- =========================================================
-- Cegah stok Alat Organik jadi minus. Sebelumnya jumlah_tersedia yang
-- cukup cuma dicek di form (browser) saat mengajukan -- kalau dua orang
-- kebetulan mengajukan alat yang sama nyaris bersamaan, keduanya bisa
-- lolos sampai tahap ACC Pimpinan 2 dan stoknya jadi minus.
--
-- Dengan constraint ini, database sendiri yang menolak transaksi kalau
-- stok tidak cukup -- Pimpinan 2 akan lihat pesan error saat ACC kalau
-- ternyata stoknya sudah keburu habis diambil pengajuan lain.
-- =========================================================

do $$
begin
  alter table alat_organik
    add constraint alat_organik_jumlah_tersedia_check
    check (jumlah_tersedia >= 0);
exception
  when duplicate_object then null;
end $$;
