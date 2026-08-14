-- =========================================================
-- Tabel data alat/peralatan survei
-- =========================================================
create table if not exists alat (
  id_alat text primary key,
  nama_alat text not null,
  tipe_alat text,
  kode_alat text,
  no_inventaris text,
  tahun_alat int,
  kondisi_alat text not null default 'Baik'
    check (kondisi_alat in ('Baik', 'Rusak')),
  status_ketersediaan text not null default 'Tersedia'
    check (status_ketersediaan in ('Tersedia', 'Dipinjam')),
  foto_url text,
  manual_url text,
  dokumen_url text,
  lokasi_penyimpanan text,
  created_at timestamptz not null default now()
);

alter table alat enable row level security;

-- Semua user yang sudah login boleh lihat daftar alat
-- (perlu tahu apa yang tersedia untuk dipinjam)
create policy "Authenticated users can view alat"
  on alat for select
  using (auth.uid() is not null);

-- Hanya admin yang boleh tambah/ubah/hapus data alat
create policy "Admins can manage alat"
  on alat for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
