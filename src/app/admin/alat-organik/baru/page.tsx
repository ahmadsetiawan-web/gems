import Navbar from "@/components/Navbar";
import AlatOrganikForm from "@/components/AlatOrganikForm";

export default function TambahAlatOrganikPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Tambah Alat Organik
        </h1>
        <div className="mt-6">
          <AlatOrganikForm mode="create" />
        </div>
      </main>
    </div>
  );
}
