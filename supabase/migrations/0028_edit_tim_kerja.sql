-- Pegawai boleh lihat data dirinya sendiri di tabel pegawai...
create policy "Users can view own pegawai data"
  on pegawai for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.nip = pegawai.nip
    )
  );

-- ...dan boleh edit kolom tim_kerja miliknya sendiri (kolom lain tetap
-- terkunci, cuma admin yang bisa ubah lewat Table Editor).
create policy "Users can update own tim_kerja"
  on pegawai for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.nip = pegawai.nip
    )
  );

grant select on pegawai to authenticated;
grant update (tim_kerja) on pegawai to authenticated;
