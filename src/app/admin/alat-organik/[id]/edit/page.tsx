import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import AlatOrganikForm from "@/components/AlatOrganikForm";

export default async function EditAlatOrganikPage(
  props: PageProps<"/admin/alat-organik/[id]/edit">
) {
  const { id } = await props.params;

  const supabase = await createClient();
  const { data: alat } = await supabase
    .from("alat_organik")
    .select("*")
    .eq("id", id)
    .single();

  if (!alat) notFound();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Edit Alat Organik
        </h1>
        <div className="mt-6">
          <AlatOrganikForm mode="edit" initialData={alat} />
        </div>
      </main>
    </div>
  );
}
