import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Proxy ini CUMA menyegarkan cookie sesi -- tidak ada pengecekan
// login/role di sini. Proteksi tiap route ditangani sendiri-sendiri
// oleh layout.tsx masing-masing (admin/layout.tsx, pimpinan/layout.tsx,
// dst). Kalau bikin route top-level baru yang harus login/role
// tertentu, jangan lupa tambahkan pengecekan getUser()+redirect() di
// layout/page-nya sendiri -- tidak ada jaring pengaman otomatis di
// level ini.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
