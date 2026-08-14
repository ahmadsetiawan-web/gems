-- =========================================================
-- Kelengkapan/part alat (per jenis alat) + checklist yang dicentang
-- peminjam saat mengajukan peminjaman.
-- =========================================================
create table if not exists kelengkapan_alat (
  id uuid primary key default gen_random_uuid(),
  nama_alat text not null references jenis_alat (nama_alat),
  nama_bagian text not null,
  no_inventaris text,
  kategori text,
  jumlah_standar int not null default 1,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

alter table kelengkapan_alat enable row level security;

create policy "Authenticated users can view kelengkapan_alat"
  on kelengkapan_alat for select
  using (auth.uid() is not null);

create policy "Admins can manage kelengkapan_alat"
  on kelengkapan_alat for all
  using (is_admin());

grant select, insert, update, delete on kelengkapan_alat to authenticated;

-- =========================================================
-- Checklist kelengkapan yang dibawa untuk 1 pengajuan peminjaman
-- =========================================================
create table if not exists peminjaman_kelengkapan (
  id uuid primary key default gen_random_uuid(),
  peminjaman_id uuid not null references peminjaman (id) on delete cascade,
  kelengkapan_id uuid not null references kelengkapan_alat (id),
  jumlah_dibawa int not null check (jumlah_dibawa >= 0),
  created_at timestamptz not null default now()
);

alter table peminjaman_kelengkapan enable row level security;

create policy "View own or admin/pimpinan peminjaman_kelengkapan"
  on peminjaman_kelengkapan for select
  using (
    exists (
      select 1 from peminjaman p
      where p.id = peminjaman_kelengkapan.peminjaman_id
        and (p.peminjam_id = auth.uid() or is_admin() or is_pimpinan())
    )
  );

create policy "Owner can insert peminjaman_kelengkapan"
  on peminjaman_kelengkapan for insert
  with check (
    exists (
      select 1 from peminjaman p
      where p.id = peminjaman_kelengkapan.peminjaman_id
        and p.peminjam_id = auth.uid()
    )
  );

grant select, insert on peminjaman_kelengkapan to authenticated;
