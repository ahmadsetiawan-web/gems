import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import ChecklistDisplay from "@/components/ChecklistDisplay";
import StatusBadge from "@/components/StatusBadge";

const BELUM_DISETUJUI = ["draft", "diajukan", "ditolak"];

export default async function RiwayatPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  type RiwayatRow = {
    id: string;
    id_alat: string;
    tanggal_pinjam: string;
    tanggal_rencana_kembali: string;
    tanggal_kembali_aktual: string | null;
    status: string;
    catatan_pimpinan: string | null;
    catatan_pengembalian: string | null;
    disetujui_oleh: string | null;
    alat: { nama_alat: string } | null;
  };

  const { data: riwayat } = (await supabase
    .from("peminjaman")
    .select(
      "id, id_alat, tanggal_pinjam, tanggal_rencana_kembali, tanggal_kembali_aktual, status, catatan_pimpinan, catatan_pengembalian, disetujui_oleh, alat(nama_alat)"
    )
    .eq("peminjam_id", user.id)
    .order("created_at", { ascending: false })) as { data: RiwayatRow[] | null };

  const riwayatSurveiIds = (riwayat ?? []).map((r) => r.id);
  const { data: unitTambahanRows } =
    riwayatSurveiIds.length > 0
      ? await supabase
          .from("peminjaman_unit_tambahan")
          .select("peminjaman_id")
          .in("peminjaman_id", riwayatSurveiIds)
      : { data: [] as { peminjaman_id: string }[] };

  const unitTambahanCount = new Map<string, number>();
  for (const row of unitTambahanRows ?? []) {
    unitTambahanCount.set(
      row.peminjaman_id,
      (unitTambahanCount.get(row.peminjaman_id) ?? 0) + 1
    );
  }

  type ChecklistRow = {
    peminjaman_id: string;
    jumlah_dibawa: number;
    kelengkapan_alat: { nama_bagian: string } | null;
  };

  const riwayatIds = (riwayat ?? []).map((r) => r.id);
  const { data: checklistRows } =
    riwayatIds.length > 0
      ? ((await supabase
          .from("peminjaman_kelengkapan")
          .select("peminjaman_id, jumlah_dibawa, kelengkapan_alat(nama_bagian)")
          .in("peminjaman_id", riwayatIds)) as { data: ChecklistRow[] | null })
      : { data: [] as ChecklistRow[] };

  const checklistByPeminjaman = new Map<string, ChecklistRow[]>();
  for (const c of checklistRows ?? []) {
    if (!checklistByPeminjaman.has(c.peminjaman_id)) {
      checklistByPeminjaman.set(c.peminjaman_id, []);
    }
    checklistByPeminjaman.get(c.peminjaman_id)!.push(c);
  }

  type RiwayatOrganikRow = {
    id: string;
    id_alat_organik: string;
    tanggal_pinjam: string;
    tanggal_rencana_kembali: string;
    tanggal_kembali_aktual: string | null;
    jumlah_diambil: number;
    status: string;
    catatan_pimpinan: string | null;
    catatan_pengembalian: string | null;
    disetujui_oleh: string | null;
    alat_organik: { nama_alat: string; merek: string | null } | null;
  };

  const { data: riwayatOrganik } = (await supabase
    .from("peminjaman_organik")
    .select(
      "id, id_alat_organik, tanggal_pinjam, tanggal_rencana_kembali, tanggal_kembali_aktual, jumlah_diambil, status, catatan_pimpinan, catatan_pengembalian, disetujui_oleh, alat_organik(nama_alat, merek)"
    )
    .eq("peminjam_id", user.id)
    .order("created_at", { ascending: false })) as {
    data: RiwayatOrganikRow[] | null;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Riwayat Peminjaman Alat Survei
          </h1>
          <div className="mt-4 space-y-2">
            {(riwayat ?? []).length === 0 && (
              <p className="text-slate-400">Belum ada riwayat peminjaman.</p>
            )}
            {(riwayat ?? []).map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {(() => {
                      const jumlahUnit = (unitTambahanCount.get(r.id) ?? 0) + 1;
                      return (
                        <p className="font-medium text-slate-900">
                          {r.alat?.nama_alat ?? "-"}
                          {jumlahUnit > 1 && ` — ${jumlahUnit} unit`}
                        </p>
                      );
                    })()}
                    <p className="text-sm text-slate-500">
                      Pinjam: {r.tanggal_pinjam} &middot; Rencana kembali:{" "}
                      {r.tanggal_rencana_kembali}
                      {r.tanggal_kembali_aktual &&
                        ` · Dikembalikan: ${r.tanggal_kembali_aktual}`}
                    </p>
                    {r.disetujui_oleh && (
                      <p className="text-sm text-slate-500">
                        {r.status === "ditolak" ? "Ditolak oleh" : "Disetujui oleh"}
                        : {r.disetujui_oleh}
                      </p>
                    )}
                    {r.catatan_pimpinan && (
                      <p className="mt-1 text-sm text-slate-600">
                        Catatan pimpinan: {r.catatan_pimpinan}
                      </p>
                    )}
                    {r.catatan_pengembalian && (
                      <p className="mt-1 text-sm text-slate-600">
                        Catatan pemeriksaan: {r.catatan_pengembalian}
                      </p>
                    )}
                    <ChecklistDisplay
                      items={(checklistByPeminjaman.get(r.id) ?? []).map((c) => ({
                        label: c.kelengkapan_alat?.nama_bagian ?? "-",
                        jumlah: c.jumlah_dibawa,
                      }))}
                    />
                    {r.status === "draft" &&
                      ((unitTambahanCount.get(r.id) ?? 0) > 0 ? (
                        <Link
                          href={`/pinjam/ajukan-kolektif?draft=${r.id}`}
                          className="mt-1 inline-block text-sm font-medium text-[#8a8300] hover:underline"
                        >
                          Lanjutkan Draft
                        </Link>
                      ) : (
                        <Link
                          href={`/pinjam/ajukan/${encodeURIComponent(r.id_alat)}`}
                          className="mt-1 inline-block text-sm font-medium text-[#8a8300] hover:underline"
                        >
                          Lanjutkan Draft
                        </Link>
                      ))}
                    {!BELUM_DISETUJUI.includes(r.status) && (
                      <div className="mt-2 flex flex-col items-start gap-1">
                        <Link
                          href={`/surat-persetujuan/${r.id}`}
                          target="_blank"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Cetak Surat Persetujuan
                        </Link>
                        <Link
                          href={`/surat/${r.id}`}
                          target="_blank"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Cetak Surat Peminjaman
                        </Link>
                        <Link
                          href={`/surat-pengantar/${r.id}`}
                          target="_blank"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Cetak Surat Pengantar Barang
                        </Link>
                        {r.status === "dikembalikan" && (
                          <Link
                            href={`/surat-pengembalian/${r.id}`}
                            target="_blank"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Cetak Surat Pengembalian
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Riwayat Peminjaman Alat Organik
          </h2>
          <div className="mt-4 space-y-2">
            {(riwayatOrganik ?? []).length === 0 && (
              <p className="text-slate-400">Belum ada riwayat peminjaman.</p>
            )}
            {(riwayatOrganik ?? []).map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {r.alat_organik?.nama_alat ?? "-"}{" "}
                      {r.alat_organik?.merek && `(${r.alat_organik.merek})`}
                      {" "}&middot; Jumlah: {r.jumlah_diambil}
                    </p>
                    <p className="text-sm text-slate-500">
                      Pinjam: {r.tanggal_pinjam} &middot; Rencana kembali:{" "}
                      {r.tanggal_rencana_kembali}
                      {r.tanggal_kembali_aktual &&
                        ` · Dikembalikan: ${r.tanggal_kembali_aktual}`}
                    </p>
                    {r.disetujui_oleh && (
                      <p className="text-sm text-slate-500">
                        {r.status === "ditolak" ? "Ditolak oleh" : "Disetujui oleh"}
                        : {r.disetujui_oleh}
                      </p>
                    )}
                    {r.catatan_pimpinan && (
                      <p className="mt-1 text-sm text-slate-600">
                        Catatan pimpinan: {r.catatan_pimpinan}
                      </p>
                    )}
                    {r.catatan_pengembalian && (
                      <p className="mt-1 text-sm text-slate-600">
                        Catatan pemeriksaan: {r.catatan_pengembalian}
                      </p>
                    )}
                    {r.status === "draft" && (
                      <Link
                        href={`/pinjam-organik/ajukan/${encodeURIComponent(r.id_alat_organik)}`}
                        className="mt-1 inline-block text-sm font-medium text-[#8a8300] hover:underline"
                      >
                        Lanjutkan Draft
                      </Link>
                    )}
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
