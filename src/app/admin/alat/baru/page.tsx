import Navbar from "@/components/Navbar";
import AlatForm from "@/components/AlatForm";

export default function TambahAlatPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Tambah Alat</h1>
        <div className="mt-6">
          <AlatForm mode="create" />
        </div>
      </main>
    </div>
  );
}
