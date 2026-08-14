import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_developer")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_developer) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
