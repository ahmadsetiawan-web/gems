-- Ganti nama "Geo Electric" -> "SuperSting Resistivity Meter", dan
-- "Leica GS18" / "Global Positioning System (GPS)" -> "Global
-- Positioning System". Aman dijalankan berkali-kali di kondisi apa pun.
--
-- Urutannya penting: tambah nama baru dulu (baris jenis_alat baru),
-- pindahkan semua alat ke nama baru itu, baru hapus baris nama lama --
-- supaya tidak pernah ada momen alat.nama_alat menunjuk ke nama yang
-- tidak ada di jenis_alat (foreign key alat_nama_alat_fkey, tanpa on
-- update cascade, akan menolak kalau urutannya kebalik).

insert into jenis_alat (nama_alat)
values ('SuperSting Resistivity Meter'), ('Global Positioning System')
on conflict (nama_alat) do nothing;

update alat set nama_alat = 'SuperSting Resistivity Meter'
where nama_alat = 'Geo Electric';

update alat set nama_alat = 'Global Positioning System'
where nama_alat in ('Leica GS18', 'Global Positioning System (GPS)');

delete from jenis_alat
where nama_alat in ('Geo Electric', 'Leica GS18', 'Global Positioning System (GPS)');
