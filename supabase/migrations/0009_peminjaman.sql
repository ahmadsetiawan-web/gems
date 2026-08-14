-- =========================================================
-- Tabel peminjaman alat
-- =========================================================
create table if not exists peminjaman (
  id uuid primary key default gen_random_uuid(),
  id_alat text not null references alat (id_alat),
  peminjam_id uuid not null references profiles (id),
  tanggal_pinjam date not null default current_date,
  tanggal_rencana_kembali date not null,
  tanggal_kembali_aktual date,
  status text not null default 'diajukan'
    check (status in ('diajukan', 'dipinjam', 'dikembalikan', 'ditolak')),
  keperluan text,
  alasan_penolakan text,
  created_at timestamptz not null default now()
);

alter table peminjaman enable row level security;

-- Peminjam lihat pengajuan miliknya sendiri; admin & pimpinan lihat semua
create policy "View own peminjaman, admin/pimpinan view all"
  on peminjaman for select
  using (
    peminjam_id = auth.uid()
    or exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and (profiles.is_admin = true or profiles.is_pimpinan = true)
    )
  );

-- Hanya user berstatus approved yang boleh ajukan peminjaman, atas namanya sendiri
create policy "Approved users can request peminjaman"
  on peminjaman for insert
  with check (
    peminjam_id = auth.uid()
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.status_approval = 'approved'
    )
  );

-- Admin & pimpinan boleh ubah status (approve/tolak/konfirmasi kembali);
-- tombol aksi yang tepat diatur di halaman masing-masing peran.
create policy "Admin/pimpinan can update peminjaman"
  on peminjaman for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and (profiles.is_admin = true or profiles.is_pimpinan = true)
    )
  );

grant select, insert, update on peminjaman to authenticated;

-- Admin & pimpinan perlu bisa lihat profil peminjam lain (nama/email)
-- saat meninjau pengajuan peminjaman, tidak cuma profil sendiri.
create policy "Admin/pimpinan can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles p2
      where p2.id = auth.uid()
        and (p2.is_admin = true or p2.is_pimpinan = true)
    )
  );

-- Status ketersediaan alat perlu status ketiga: "Diajukan"
-- (menunggu Acc pimpinan, beda dari "Dipinjam" yang sudah pasti keluar)
alter table alat drop constraint if exists alat_status_ketersediaan_check;
alter table alat add constraint alat_status_ketersediaan_check
  check (status_ketersediaan in ('Tersedia', 'Diajukan', 'Dipinjam'));

-- =========================================================
-- Trigger: status_ketersediaan alat mengikuti status peminjaman
-- secara otomatis (SECURITY DEFINER supaya tetap jalan meski
-- peminjam biasa tidak punya izin ubah tabel alat langsung).
-- =========================================================
create or replace function sync_alat_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update alat
  set status_ketersediaan = case new.status
    when 'diajukan' then 'Diajukan'
    when 'dipinjam' then 'Dipinjam'
    else 'Tersedia'
  end
  where id_alat = new.id_alat;
  return new;
end;
$$;

create trigger on_peminjaman_status_change
  after insert or update of status on peminjaman
  for each row execute procedure sync_alat_status();
