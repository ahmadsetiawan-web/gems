import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

export default async function InfoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#8a8300]">
            Tentang GEMS
          </h1>
          <p className="mt-2 text-slate-600">
            <strong className="text-[#8a8300]">
              GEMS (Geophysical Equipment Management System)
            </strong>{" "}
            adalah aplikasi untuk mengelola peminjaman dan pengembalian
            peralatan survei geofisika serta peralatan organik di
            lingkungan Badan Geologi, mulai dari pengajuan peminjaman,
            persetujuan berjenjang, pemeriksaan fisik alat, sampai
            penerbitan surat secara elektronik.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Dua Kategori Alat
          </h2>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>
              <strong className="text-slate-900">Alat Survei</strong> —
              dicatat per unit fisik (masing-masing punya nomor
              inventaris sendiri), bisa dilengkapi checklist
              kelengkapan/aksesori, dan bisa dipinjam banyak unit
              sekaligus (peminjaman kolektif) untuk jenis alat yang sama.
            </p>
            <p>
              <strong className="text-slate-900">Alat Organik</strong> —
              dicatat per jumlah/stok (bukan per unit fisik), misalnya
              kamera, kompas, atau alat kerja lapangan lainnya.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Peran & Tanggung Jawab
          </h2>
          <div className="mt-3 space-y-4 text-sm">
            <div>
              <p className="font-medium text-slate-900">Peminjam</p>
              <p className="text-slate-600">
                Semua pegawai yang sudah punya akun. Mengajukan
                peminjaman alat, melihat riwayat peminjaman miliknya
                sendiri, dan mencetak surat untuk pengajuan yang sudah
                disetujui.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">
                Pimpinan 1 (Ketua Tim Kerja Pengembangan Konsep Geosains)
              </p>
              <p className="text-slate-600">
                Menyetujui atau menolak pengajuan peminjaman yang masuk,
                sebagai persetujuan tahap pertama.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">
                Pimpinan 2 (Penanggungjawab Administrasi dan Layanan
                Sarana Penyelidikan)
              </p>
              <p className="text-slate-600">
                Menunjuk Teknisi untuk memeriksa kondisi alat — baik
                sebelum alat dipinjamkan maupun saat alat dikembalikan —
                lalu menyetujui (ACC) hasil pemeriksaan Teknisi tersebut.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Teknisi</p>
              <p className="text-slate-600">
                Memeriksa kondisi fisik alat secara langsung, baik
                sebelum diserahkan ke peminjam maupun saat alat kembali,
                lalu melaporkan hasil pemeriksaannya.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Admin</p>
              <p className="text-slate-600">
                Mengelola data alat & pengguna, memantau status semua
                peminjaman, dan melakukan konfirmasi final setelah alat
                selesai dikembalikan.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Developer</p>
              <p className="text-slate-600">
                Mengelola & mengembangkan aplikasi ini secara teknis
                (lihat kontak di bagian bawah halaman ini).
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Alur Peminjaman
          </h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
            <li>Peminjam mengajukan peminjaman alat.</li>
            <li>Pimpinan 1 menyetujui atau menolak pengajuan.</li>
            <li>
              Pimpinan 2 menunjuk Teknisi untuk memeriksa alat sebelum
              diserahkan.
            </li>
            <li>Teknisi memeriksa alat dan melaporkan hasilnya.</li>
            <li>
              Pimpinan 2 menyetujui hasil pemeriksaan — alat resmi
              dipinjamkan.
            </li>
            <li>
              Saat alat kembali, Pimpinan 2 menunjuk Teknisi untuk
              memeriksa kondisi alat yang dikembalikan.
            </li>
            <li>Teknisi memeriksa dan melaporkan kondisi alat.</li>
            <li>Pimpinan 2 menyetujui hasil pemeriksaan pengembalian.</li>
            <li>
              Admin melakukan konfirmasi final — peminjaman dinyatakan
              selesai.
            </li>
          </ol>
          <Image
            src="/alur_peminjaman.png"
            alt="Diagram alur peminjaman peralatan pada aplikasi GEMS, 9 langkah dari Peminjam mengajukan sampai Admin konfirmasi final"
            width={1536}
            height={1024}
            className="mt-4 w-full rounded-lg border border-slate-200"
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Dokumen Surat
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Setiap surat diterbitkan otomatis oleh sistem pada tahap
            terkait, ditandatangani secara elektronik (bukan tanda
            tangan basah), dan bisa dicetak dari halaman Riwayat.
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
            <li>
              <strong className="text-slate-900">
                Surat Persetujuan Peminjaman
              </strong>{" "}
              — terbit setelah Pimpinan 1 menyetujui.
            </li>
            <li>
              <strong className="text-slate-900">
                Surat Peminjaman Peralatan
              </strong>{" "}
              — terbit setelah alat resmi dipinjamkan.
            </li>
            <li>
              <strong className="text-slate-900">
                Surat Pengantar Barang
              </strong>{" "}
              — khusus Alat Survei, terbit bersamaan dengan Surat
              Peminjaman.
            </li>
            <li>
              <strong className="text-slate-900">
                Surat Pengembalian Peralatan
              </strong>{" "}
              — terbit setelah Admin mengonfirmasi pengembalian selesai.
            </li>
          </ul>
        </div>

        <div className="rounded-lg border border-[#d1cb23] bg-[#F6EE29]/10 p-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Ada Kendala?
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Kalau ada kendala teknis atau pertanyaan seputar aplikasi
            ini, silakan hubungi:
          </p>
          <p className="mt-2 text-sm">
            <span className="font-medium text-slate-900">
              Ahmad Setiawan, S.Si., M.T.
            </span>{" "}
            <span className="text-slate-500">— Developer</span>
            <br />
            <span className="text-slate-600">
              email : ahmad.setiawan@esdm.go.id
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
