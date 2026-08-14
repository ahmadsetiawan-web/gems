"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

type Kelengkapan = {
  id: string;
  nomor: string | null;
  nama_bagian: string;
  no_inventaris: string | null;
  kategori: string | null;
  jumlah_standar: number;
};

export default function KelengkapanManager({
  idAlat,
  data,
}: {
  idAlat: string;
  data: Kelengkapan[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [nomor, setNomor] = useState("");
  const [namaBagian, setNamaBagian] = useState("");
  const [noInventaris, setNoInventaris] = useState("");
  const [kategori, setKategori] = useState("");
  const [jumlahStandar, setJumlahStandar] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { error: insertError } = await supabase
      .from("kelengkapan_alat")
      .insert({
        id_alat: idAlat,
        nomor: nomor.trim() || null,
        nama_bagian: namaBagian.trim(),
        no_inventaris: noInventaris.trim() || null,
        kategori: kategori.trim() || null,
        jumlah_standar: parseInt(jumlahStandar, 10) || 1,
      });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setNomor("");
    setNamaBagian("");
    setNoInventaris("");
    setKategori("");
    setJumlahStandar("1");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus kelengkapan ini?")) return;

    setDeletingId(id);
    await supabase.from("kelengkapan_alat").delete().eq("id", id);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Kelengkapan / Part Alat
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Daftar ini akan muncul sebagai checklist saat peminjam mengajukan
        peminjaman alat ini.
      </p>

      <div className="mt-4 space-y-2">
        {data.length === 0 && (
          <p className="text-sm text-slate-400">
            Belum ada kelengkapan terdaftar.
          </p>
        )}
        {data.map((k) => (
          <div
            key={k.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium text-slate-800">
                {k.nomor && (
                  <span className="text-slate-400">{k.nomor} &middot; </span>
                )}
                {k.nama_bagian}{" "}
                {k.kategori && (
                  <span className="text-xs font-normal text-slate-400">
                    ({k.kategori})
                  </span>
                )}
              </p>
              <p className="text-slate-500">
                Jumlah: {k.jumlah_standar}
                {k.no_inventaris && ` · No. Inv: ${k.no_inventaris}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(k.id)}
              disabled={deletingId === k.id}
              className="text-red-600 hover:underline disabled:opacity-50"
            >
              Hapus
            </button>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleAdd}
        className="mt-5 space-y-3 border-t border-slate-200 pt-4"
      >
        <p className="text-sm font-medium text-slate-700">
          Tambah Kelengkapan
        </p>
        <Input
          label="Nomor"
          value={nomor}
          onChange={(e) => setNomor(e.target.value)}
          placeholder="Misal: SS1/04"
        />
        <Input
          label="Nama Bagian"
          value={namaBagian}
          onChange={(e) => setNamaBagian(e.target.value)}
          required
          placeholder="Misal: Battery cable for 12V"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="No. Inventaris"
            value={noInventaris}
            onChange={(e) => setNoInventaris(e.target.value)}
          />
          <Input
            label="Jumlah Standar"
            type="number"
            min={1}
            value={jumlahStandar}
            onChange={(e) => setJumlahStandar(e.target.value)}
          />
        </div>
        <Input
          label="Kategori (opsional)"
          value={kategori}
          onChange={(e) => setKategori(e.target.value)}
          placeholder="Misal: Equipments 2004"
        />
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menambahkan..." : "Tambah"}
        </Button>
      </form>
    </div>
  );
}
