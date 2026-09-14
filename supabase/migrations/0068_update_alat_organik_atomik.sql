-- =========================================================
-- Perbaiki penghitungan jumlah_tersedia saat admin edit alat organik.
--
-- Sebelumnya AlatOrganikForm.tsx menghitung selisih di browser
-- (jumlah baru - jumlah_total yang di-load saat form dibuka) lalu
-- mengirim jumlah_tersedia hasil hitungan itu. Kalau ada peminjaman yang
-- disetujui/dikembalikan (mengubah jumlah_tersedia lewat trigger di
-- 0050_alur_pengembalian.sql) di antara form dibuka dan disimpan, hasil
-- hitungan itu memakai angka yang sudah basi -- silently menimpa
-- jumlah_tersedia yang sebenarnya sudah benar di database.
--
-- Function ini menghitung selisih di dalam satu UPDATE atomik memakai
-- nilai jumlah_total yang sedang tersimpan di database saat itu juga,
-- bukan nilai yang di-load browser sebelumnya.
-- =========================================================

create or replace function update_alat_organik(
  p_id uuid,
  p_nama_alat text,
  p_merek text,
  p_nup text,
  p_tahun_pembelian integer,
  p_kondisi_alat text,
  p_jumlah_total integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Hanya admin yang boleh mengubah data alat organik';
  end if;

  update alat_organik
  set nama_alat = p_nama_alat,
      merek = p_merek,
      nup = p_nup,
      tahun_pembelian = p_tahun_pembelian,
      kondisi_alat = p_kondisi_alat,
      jumlah_tersedia = jumlah_tersedia + (p_jumlah_total - jumlah_total),
      jumlah_total = p_jumlah_total
  where id = p_id;
end;
$$;

grant execute on function update_alat_organik(
  uuid, text, text, text, integer, text, integer
) to authenticated;
