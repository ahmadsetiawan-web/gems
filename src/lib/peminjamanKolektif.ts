import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Peminjaman kolektif: peminjaman.id_alat cuma unit "utama"; unit
// tambahan (kalau ada) tersimpan di peminjaman_unit_tambahan. Fungsi ini
// menghitung jumlah unit tambahan per peminjaman supaya halaman list bisa
// menampilkan "{nama_alat} — N unit" untuk pengajuan kolektif.
export async function getJumlahUnitTambahan(
  supabase: SupabaseServerClient,
  peminjamanIds: string[]
): Promise<Record<string, number>> {
  if (peminjamanIds.length === 0) return {};

  const { data } = await supabase
    .from("peminjaman_unit_tambahan")
    .select("peminjaman_id")
    .in("peminjaman_id", peminjamanIds);

  const jumlah: Record<string, number> = {};
  for (const row of (data ?? []) as { peminjaman_id: string }[]) {
    jumlah[row.peminjaman_id] = (jumlah[row.peminjaman_id] ?? 0) + 1;
  }
  return jumlah;
}

// Label tampilan: "N unit" ditambahkan hanya kalau ini pengajuan
// kolektif (unit tambahan > 0); pengajuan satuan tampil apa adanya.
export function labelJumlahUnit(
  namaAlat: string,
  jumlahUnitTambahan: number | undefined
): string {
  const total = (jumlahUnitTambahan ?? 0) + 1;
  return total > 1 ? `${namaAlat} — ${total} unit` : namaAlat;
}
