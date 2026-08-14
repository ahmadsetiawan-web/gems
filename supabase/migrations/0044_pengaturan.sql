-- =========================================================
-- Tabel pengaturan (satu baris saja / singleton) untuk data yang
-- dulunya hardcode di kode, misal nama Penanggungjawab Administrasi
-- dan Layanan Sarana Penyelidikan (Pimpinan 2) yang tampil di surat
-- cetak. Admin bisa ubah sendiri kapan saja lewat halaman Pengaturan,
-- tidak perlu minta developer edit kode tiap kali ada pergantian orang.
-- =========================================================
create table if not exists pengaturan (
  id boolean primary key default true,
  nama_penanggungjawab_administrasi text not null,
  nip_penanggungjawab_administrasi text not null,
  updated_at timestamptz not null default now(),
  constraint pengaturan_singleton check (id)
);

insert into pengaturan (id, nama_penanggungjawab_administrasi, nip_penanggungjawab_administrasi)
values (true, 'Robby Setianegara, A.Md., S.Si., M.T', '198208082006041001')
on conflict (id) do nothing;

alter table pengaturan enable row level security;

create policy "Authenticated users can view pengaturan"
  on pengaturan for select
  using (auth.uid() is not null);

create policy "Admin can update pengaturan"
  on pengaturan for update
  using (is_admin());

grant select, update on pengaturan to authenticated;
