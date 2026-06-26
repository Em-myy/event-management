import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AdminTabs from "@/components/AdminTabs";
import { buildAdminQueries } from "@/utils/queries";

export const metadata = { title: "Admin Panel — ESRMS" };

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  /* ── Gate: Administrators only ──────────────────────────── */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role_id < 3) redirect("/dashboard");

  /* ── Fetch all five data sets in parallel ───────────────── */
  const queries = buildAdminQueries(supabase);

  const [venuesRes, resourcesRes, usersRes, invitesRes, bookingsRes] =
    await Promise.all([
      queries.venues,
      queries.resources,
      queries.users,
      queries.invites,
      queries.bookings,
    ]);

  return (
    <div className="animate-fade-in w-full">
      <div className="page-header mb-6 sm:mb-8 flex flex-col gap-1 sm:gap-2">
        <h1 className="page-title text-2xl sm:text-3xl md:text-4xl break-words">Admin Panel</h1>
        <p className="page-subtitle text-sm sm:text-base break-words">
          Manage venues, resources, user roles, staff invites, and all bookings
        </p>
      </div>

      <AdminTabs
        initialVenues    = {venuesRes.data    ?? []}
        initialResources = {resourcesRes.data ?? []}
        initialUsers     = {usersRes.data     ?? []}
        initialInvites   = {invitesRes.data   ?? []}
        initialBookings  = {bookingsRes.data  ?? []}
      />
    </div>
  );
}