-- =========================================================
-- Checklist kelengkapan saat PENGEMBALIAN: Teknisi yang ditugaskan
-- Pimpinan 2 untuk cek alat kembali perlu bisa centang/qty tiap
-- kelengkapan sama seperti saat Serah Terima (pra-pinjam), supaya bisa
-- ketahuan & dicatat kalau ada part yang hilang/rusak saat kembali.
--
-- Disimpan di tabel terpisah dari peminjaman_kelengkapan (checklist
-- saat serah terima/pinjam keluar) supaya riwayat "apa yang dipinjamkan"
-- tidak tertimpa oleh "apa yang benar-benar kembali".
-- =========================================================

create table if not exists peminjaman_kelengkapan_kembali (
  id uuid primary key default gen_random_uuid(),
  peminjaman_id uuid not null references peminjaman (id) on delete cascade,
  kelengkapan_id uuid not null references kelengkapan_alat (id),
  jumlah_dikembalikan int not null check (jumlah_dikembalikan >= 0),
  created_at timestamptz not null default now()
);

alter table peminjaman_kelengkapan_kembali enable row level security;

create policy "View own or admin/pimpinan/teknisi peminjaman_kelengkapan_kembali"
  on peminjaman_kelengkapan_kembali for select
  using (
    exists (
      select 1 from peminjaman p
      where p.id = peminjaman_kelengkapan_kembali.peminjaman_id
        and (
          p.peminjam_id = auth.uid()
          or is_admin() or is_pimpinan() or is_pimpinan2() or is_teknisi()
        )
    )
  );

create policy "Teknisi can insert peminjaman_kelengkapan_kembali while assigned"
  on peminjaman_kelengkapan_kembali for insert
  with check (
    exists (
      select 1 from peminjaman p
      where p.id = peminjaman_kelengkapan_kembali.peminjaman_id
        and p.ditugaskan_ke = auth.uid() and p.status = 'pengembalian_ditugaskan'
    )
  );

create policy "Teknisi can update peminjaman_kelengkapan_kembali while assigned"
  on peminjaman_kelengkapan_kembali for update
  using (
    exists (
      select 1 from peminjaman p
      where p.id = peminjaman_kelengkapan_kembali.peminjaman_id
        and p.ditugaskan_ke = auth.uid() and p.status = 'pengembalian_ditugaskan'
    )
  );

create policy "Teknisi can delete peminjaman_kelengkapan_kembali while assigned"
  on peminjaman_kelengkapan_kembali for delete
  using (
    exists (
      select 1 from peminjaman p
      where p.id = peminjaman_kelengkapan_kembali.peminjaman_id
        and p.ditugaskan_ke = auth.uid() and p.status = 'pengembalian_ditugaskan'
    )
  );

grant select, insert, update, delete on peminjaman_kelengkapan_kembali to authenticated;
