import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import DashboardRealtime from "@/components/DashboardRealtime";
import { buildRecentQuery } from "@/utils/queries";

export const metadata = { title: "Dashboard — ESRMS" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, roles ( name )")
    .eq("id", user.id)
    .single();

  const isStaff = (profile?.role_id ?? 1) >= 2;

  const [ownRes, recentRes] = await Promise.all([
    supabase.from("events").select("status").eq("user_id", user.id),
    buildRecentQuery(supabase, user.id),
  ]);

  let pendingAll = 0;
  if (isStaff) {
    const { count } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pendingAll = count ?? 0;
  }

  const own = ownRes.data ?? [];
  const stats = {
    total: own.length,
    approved: own.filter((e) => e.status === "approved").length,
    pending: own.filter((e) => e.status === "pending").length,
    rejected: own.filter((e) => e.status === "rejected").length,
  };
  const recent = recentRes.data ?? [];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const roleName =
    profile?.roles?.name === "admin"
      ? "System Administrator"
      : profile?.roles?.name === "hod"
        ? "Event Coordinator / HOD"
        : "General User";

  return (
    <div className="animate-fade-in w-full">
      <div className="page-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
        <div className="w-full sm:w-auto wrap-break-word">
          <p className="text-slate-500 text-sm font-medium">{greeting},</p>
          <h1 className="page-title text-2xl sm:text-3xl md:text-4xl">
            {profile?.username ?? user.email}
          </h1>
          <p className="page-subtitle text-sm sm:text-base">{roleName}</p>
        </div>
        <Link
          href="/bookings/new"
          className="flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:opacity-90 shadow-sm"
          style={{ background: "#0D1A38" }}
        >
          <CalendarPlus className="w-4 h-4" />
          New Booking
        </Link>
      </div>

      <DashboardRealtime
        userId={user.id}
        isStaff={isStaff}
        initialStats={stats}
        initialPendingAll={pendingAll}
        initialRecent={recent}
      />
    </div>
  );
}
