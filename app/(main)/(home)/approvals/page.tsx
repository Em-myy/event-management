// File: src/app/(main)/(home)/approvals/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ApprovalsRealtimeList from "@/components/ApprovalsRealtimeList";
import { buildPendingQuery } from "@/utils/queries";

export const metadata = { title: "Approvals — ESRMS" };

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role_id < 2) redirect("/dashboard");

  const { data: pending } = await buildPendingQuery(supabase);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Pending Approvals</h1>
        <p className="page-subtitle">
          Review and action booking requests awaiting your decision
        </p>
      </div>

      <ApprovalsRealtimeList initialBookings={pending ?? []} />
    </div>
  );
}