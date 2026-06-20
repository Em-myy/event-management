import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, roles(name, label)")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-y-auto">
        {/* Changed py-8 to pt-20 lg:pt-8 pb-8 */}
        <div className="max-w-7xl mx-auto px-6 pt-20 lg:pt-8 pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
