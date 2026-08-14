-- Catat otomatis siapa (nama pimpinan yang login) yang menyetujui/menolak
-- pengajuan peminjaman, untuk keperluan audit/jejak persetujuan.
alter table peminjaman add column if not exists disetujui_oleh text;

create or replace function set_disetujui_oleh()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'diajukan' and new.status in ('dipinjam', 'ditolak') then
    select nama into new.disetujui_oleh from profiles where id = auth.uid();
  end if;
  return new;
end;
$$;

create trigger on_peminjaman_set_disetujui_oleh
  before update of status on peminjaman
  for each row execute procedure set_disetujui_oleh();
