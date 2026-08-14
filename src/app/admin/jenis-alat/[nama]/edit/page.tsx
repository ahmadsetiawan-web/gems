import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import JenisAlatForm from "@/components/JenisAlatForm";

export default async function EditJenisAlatPage(
  props: PageProps<"/admin/jenis-alat/[nama]/edit">
) {
  const { nama } = await props.params;
  const namaAlat = decodeURIComponent(nama);

  const supabase = await createClient();
  const { data: jenis } = await supabase
    .from("jenis_alat")
    .select("*")
    .eq("nama_alat", namaAlat)
    .single();

  if (!jenis) notFound();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Kelola Foto &amp; Dokumen Jenis Alat
        </h1>
        <div className="mt-6">
          <JenisAlatForm jenis={jenis} />
        </div>
      </main>
    </div>
  );
}
