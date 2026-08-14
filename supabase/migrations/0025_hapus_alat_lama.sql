-- Hapus semua alat LAMA yang tidak ada di data terbaru (6 unit).
-- Kalau ada unit yang gagal dihapus karena masih punya riwayat
-- peminjaman/kelengkapan terdaftar, itu proteksi data - perlu dicek manual.
delete from alat
where id_alat not in ('L&R_525', 'SCINTREXCG6_670', 'MTU5C_725', 'GEM_19T_123', 'SUPERSTING_229', 'GEOBITC100_01');
