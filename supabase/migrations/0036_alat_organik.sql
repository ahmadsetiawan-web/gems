-- =========================================================
-- Alat organik: kategori alat sederhana (palu, lup, kompas, kamera, dst),
-- dicatat per jenis dengan JUMLAH total (bukan per unit fisik seperti
-- alat survei). Tabel terpisah dari alat survei sesuai arahan user.
-- =========================================================
create table if not exists alat_organik (
  id uuid primary key default gen_random_uuid(),
  nama_alat text not null unique,
  merek text,
  nup text,
  tahun_pembelian int,
  kondisi_alat text not null default 'Baik'
    check (kondisi_alat in ('Baik', 'Rusak')),
  jumlah_total int not null default 0,
  jumlah_tersedia int not null default 0,
  foto_url text,
  created_at timestamptz not null default now()
);

alter table alat_organik enable row level security;

create policy "Authenticated users can view alat_organik"
  on alat_organik for select
  using (auth.uid() is not null);

create policy "Admins can manage alat_organik"
  on alat_organik for all
  using (is_admin());

grant select, insert, update, delete on alat_organik to authenticated;

-- =========================================================
-- Peminjaman alat organik (alur sama seperti peminjaman alat survei:
-- diajukan -> disetujui pimpinan -> diambil -> admin konfirmasi kembali)
-- =========================================================
create table if not exists peminjaman_organik (
  id uuid primary key default gen_random_uuid(),
  id_alat_organik uuid not null references alat_organik (id),
  peminjam_id uuid not null references profiles (id),
  jumlah_diambil int not null check (jumlah_diambil > 0),
  tanggal_pinjam date not null default current_date,
  tanggal_rencana_kembali date not null,
  tanggal_kembali_aktual date,
  status text not null default 'diajukan'
    check (status in ('diajukan', 'dipinjam', 'dikembalikan', 'ditolak')),
  keperluan text,
  catatan_pimpinan text,
  catatan_pengembalian text,
  disetujui_oleh text,
  created_at timestamptz not null default now()
);

alter table peminjaman_organik enable row level security;

create policy "View own or admin/pimpinan peminjaman_organik"
  on peminjaman_organik for select
  using (
    peminjam_id = auth.uid() or is_admin() or is_pimpinan()
  );

create policy "Approved users can request peminjaman_organik"
  on peminjaman_organik for insert
  with check (peminjam_id = auth.uid() and is_approved());

create policy "Admin/pimpinan can update peminjaman_organik"
  on peminjaman_organik for update
  using (is_admin() or is_pimpinan());

grant select, insert, update on peminjaman_organik to authenticated;

-- Catat otomatis siapa yang menyetujui/menolak (fungsi yang sama
-- dipakai untuk peminjaman alat survei, tabel-agnostik).
create trigger on_peminjaman_organik_set_disetujui_oleh
  before update of status on peminjaman_organik
  for each row execute procedure set_disetujui_oleh();

-- Stok jumlah_tersedia otomatis berkurang saat disetujui (dipinjam),
-- dan bertambah lagi saat dikembalikan.
create or replace function sync_alat_organik_stok()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'diajukan' and new.status = 'dipinjam' then
    update alat_organik
    set jumlah_tersedia = jumlah_tersedia - new.jumlah_diambil
    where id = new.id_alat_organik;
  elsif old.status = 'dipinjam' and new.status = 'dikembalikan' then
    update alat_organik
    set jumlah_tersedia = jumlah_tersedia + new.jumlah_diambil
    where id = new.id_alat_organik;
  end if;
  return new;
end;
$$;

create trigger on_peminjaman_organik_sync_stok
  after update of status on peminjaman_organik
  for each row execute procedure sync_alat_organik_stok();
