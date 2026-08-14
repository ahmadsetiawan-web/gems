import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Pimpinan2Layout({
  children,
}: LayoutProps<"/pimpinan2">) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pimpinan2, is_developer")
    .eq("id", user.id)
    .single();

  if (!profile?.is_pimpinan2 && !profile?.is_developer) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
