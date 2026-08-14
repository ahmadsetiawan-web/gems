-- =========================================================
-- Pindahkan foto/manual/dokumen dari level unit ke level jenis alat.
-- Unit-unit dalam 1 jenis (misal 8 unit "Gravimeter LaCoste & Romberg")
-- secara fisik identik, jadi tidak perlu foto/manual/dokumen berulang
-- per unit - cukup 1 per jenis.
-- =========================================================
create table if not exists jenis_alat (
  nama_alat text primary key,
  foto_url text,
  manual_url text,
  dokumen_url text,
  created_at timestamptz not null default now()
);

alter table jenis_alat enable row level security;

create policy "Authenticated users can view jenis_alat"
  on jenis_alat for select
  using (auth.uid() is not null);

create policy "Admins can manage jenis_alat"
  on jenis_alat for all
  using (is_admin());

grant select, insert, update, delete on jenis_alat to authenticated;

-- Backfill: 1 baris jenis_alat per nama_alat yang sudah ada,
-- selamatkan foto/manual/dokumen yang sudah pernah diupload
-- (kalau beda unit dalam 1 jenis punya nilai beda, ambil salah satu).
insert into jenis_alat (nama_alat, foto_url, manual_url, dokumen_url)
select
  nama_alat,
  (array_agg(foto_url) filter (where foto_url is not null))[1],
  (array_agg(manual_url) filter (where manual_url is not null))[1],
  (array_agg(dokumen_url) filter (where dokumen_url is not null))[1]
from alat
group by nama_alat
on conflict (nama_alat) do nothing;

-- alat.nama_alat sekarang mengacu ke jenis_alat (integritas data)
alter table alat add constraint alat_nama_alat_fkey
  foreign key (nama_alat) references jenis_alat (nama_alat);

-- Kolom foto/manual/dokumen di alat sudah tidak dipakai, pindah ke jenis_alat
alter table alat drop column if exists foto_url;
alter table alat drop column if exists manual_url;
alter table alat drop column if exists dokumen_url;
