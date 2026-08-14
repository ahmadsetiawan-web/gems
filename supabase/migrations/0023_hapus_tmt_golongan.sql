-- Kolom tmt_golongan sudah tidak dipakai (data sumber terbaru tidak
-- menyediakannya lagi), dan tidak ada kode aplikasi yang bergantung padanya.
alter table pegawai drop column if exists tmt_golongan;
