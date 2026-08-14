-- =========================================================
-- Pisahkan otorisasi admin & pimpinan dari 'role' dasar.
-- role tetap identitas asal (pegawai/non_pegawai), sedangkan
-- admin & pimpinan jadi flag terpisah yang bisa dipasang/dicabut
-- kapan saja tanpa mengubah identitas dasar akun.
-- =========================================================
alter table profiles add column if not exists is_admin boolean not null default false;
alter table profiles add column if not exists is_pimpinan boolean not null default false;

-- Pindahkan status admin yang sudah ada ke kolom baru,
-- kembalikan role akun ini ke identitas aslinya (pegawai).
-- Sekaligus jadikan pimpinan sementara untuk uji coba alur approval.
update profiles
set is_admin = true, is_pimpinan = true, role = 'pegawai'
where email = 'ahmadsetiawan01@gmail.com';

-- role sekarang murni identitas pendaftaran, 'admin' bukan lagi nilai yang valid
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('pegawai', 'non_pegawai'));

-- Perbarui aturan akses alat: pakai flag is_admin, bukan role
drop policy if exists "Admins can manage alat" on alat;
create policy "Admins can manage alat"
  on alat for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );
