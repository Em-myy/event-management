import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import type { QueryData } from "@supabase/supabase-js";

function buildProfileQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  return supabase
    .from("profiles")
    .select("*, roles ( name, label )")
    .eq("id", userId)
    .single();
}

export type SidebarProfile = QueryData<ReturnType<typeof buildProfileQuery>>;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await buildProfileQuery(supabase, user.id);

  /* Only fetch the pending count if the user can actually see
     the Approvals nav item — Lecturers never need this query. */
  let initialPendingCount = 0;
  if (profile && profile.role_id >= 2) {
    const { count } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    initialPendingCount = count ?? 0;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar profile={profile} initialPendingCount={initialPendingCount} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}