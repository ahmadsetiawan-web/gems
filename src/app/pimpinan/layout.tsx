import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PimpinanLayout({
  children,
}: LayoutProps<"/pimpinan">) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pimpinan, is_developer")
    .eq("id", user.id)
    .single();

  if (!profile?.is_pimpinan && !profile?.is_developer) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
