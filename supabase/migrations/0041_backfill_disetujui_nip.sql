-- Isi ulang NIP untuk pengajuan yang sudah disetujui sebelum kolom
-- disetujui_oleh_nip ditambahkan (migration 0040), supaya surat lama
-- ikut lengkap. Dicocokkan lewat nama (disetujui_oleh menyimpan nama
-- persis dari profiles.nama saat disetujui).
update peminjaman p
set disetujui_oleh_nip = prof.nip
from profiles prof
where p.disetujui_oleh is not null
  and p.disetujui_oleh_nip is null
  and prof.nama = p.disetujui_oleh;

update peminjaman_organik p
set disetujui_oleh_nip = prof.nip
from profiles prof
where p.disetujui_oleh is not null
  and p.disetujui_oleh_nip is null
  and prof.nama = p.disetujui_oleh;
