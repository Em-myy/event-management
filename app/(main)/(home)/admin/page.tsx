import { redirect } from 'next/navigation';
import AdminTabs from '@/components/AdminTabs';
import { createClient } from '@/utils/supabase/server';
import { Database } from '@/types/database.types';
import { InviteRecord } from '@/components/AdminInvitePanel';

type VenueRow = Database['public']['Tables']['venues']['Row'];
type ResourceRow = Database['public']['Tables']['resources']['Row'];

export type AdminUserWithRole = Database['public']['Tables']['profiles']['Row'] & {
  roles: {
    name: string;
    label: string;
  } | null;
};

export type AdminInviteWithInviter = Database['public']['Tables']['invites']['Row'] & {
  profiles: {
    username: string | null;
  } | null;
};

export const metadata = { title: 'Admin Panel — ESRMS' };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  /* ── Gate: Administrators only ──────────────────────────── */
  const { data: profile } = await supabase
    .from('profiles')
    .select('role_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role_id < 3) redirect('/dashboard');

  /* ── Fetch all four data sets in parallel ───────────────── */
  const [venuesRes, resourcesRes, usersRes, invitesRes] = await Promise.all([
    supabase
      .from('venues')
      .select('*')
      .order('name'),

    supabase
      .from('resources')
      .select('*')
      .order('name'),

    supabase
      .from('profiles')
      .select('*, roles(name, label)')
      .order('full_name'),

    supabase
      .from('invites')
      .select(`
        id,
        email,
        role_id,
        department,
        status,
        created_at,
        accepted_at,
        profiles!invites_invited_by_fkey ( full_name )
      `)
      .order('created_at', { ascending: false }),
  ]);

  const venues = (venuesRes.data ?? []) as VenueRow[];
  const resources = (resourcesRes.data ?? []) as ResourceRow[];
  const users = (usersRes.data ?? []) as unknown as AdminUserWithRole[];
  const invites = (invitesRes.data ?? []) as unknown as AdminInviteWithInviter[];

  return (
    <div className="animate-fade-in">
      {/* Added responsive bottom margin to match the rest of the app */}
      <div className="page-header mb-6 sm:mb-8">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">
          Manage venues, resources, user roles, and staff invites
        </p>
      </div>

      {/* The actual responsive heavy lifting will be inside AdminTabs */}
      <AdminTabs
        initialVenues={venues}
        initialResources={resources}
        initialUsers={users}
        initialInvites={invites as InviteRecord[]}
      />
    </div>
  );
}