import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import AlatForm from "@/components/AlatForm";
import KelengkapanManager from "@/components/KelengkapanManager";

export default async function EditAlatPage(
  props: PageProps<"/admin/alat/[id]/edit">
) {
  const { id } = await props.params;
  const idAlat = decodeURIComponent(id);

  const supabase = await createClient();
  const { data: alat } = await supabase
    .from("alat")
    .select("*")
    .eq("id_alat", idAlat)
    .single();

  if (!alat) {
    notFound();
  }

  const { data: kelengkapan } = await supabase
    .from("kelengkapan_alat")
    .select("id, nomor, nama_bagian, no_inventaris, kategori, jumlah_standar")
    .eq("id_alat", idAlat)
    .order("urutan")
    .order("created_at");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Edit Alat
          </h1>
          <div className="mt-6">
            <AlatForm mode="edit" initialData={alat} />
          </div>
        </div>

        <div>
          <KelengkapanManager idAlat={idAlat} data={kelengkapan ?? []} />
        </div>
      </main>
    </div>
  );
}
