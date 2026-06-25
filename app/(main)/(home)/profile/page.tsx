// File: src/app/(app)/profile/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/ProfileClient";

// ✅ Import your builders from the central queries file
import { buildProfileQuery, buildStatsQuery } from "@/utils/queries";

export const metadata = { title: "My Profile — ESRMS" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) redirect("/");

  // Use the imported builders
  const [profileRes, statsRes] = await Promise.all([
    buildProfileQuery(supabase, user.id),
    buildStatsQuery(supabase, user.id),
  ]);

  if (!profileRes.data) redirect("/");

  const events = statsRes.data ?? [];
  const stats = {
    total:    events.length,
    approved: events.filter((e) => e.status === "approved").length,
    pending:  events.filter((e) => e.status === "pending").length,
    rejected: events.filter((e) => e.status === "rejected").length,
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">
          Manage your personal information and account settings
        </p>
      </div>
      <ProfileClient
        profile={profileRes.data}
        email={user.email ?? ""}
        createdAt={user.created_at}
        stats={stats}
      />
    </div>
  );
}