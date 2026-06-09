import { createClient } from '@/lib/supabase/server';
import { redirect }     from 'next/navigation';
import AdminTabs        from '@/components/AdminTabs';

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

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">
          Manage venues, resources, user roles, and staff invites
        </p>
      </div>

      <AdminTabs
        initialVenues    = {venuesRes.data    ?? []}
        initialResources = {resourcesRes.data ?? []}
        initialUsers     = {usersRes.data     ?? []}
        initialInvites   = {invitesRes.data   ?? []}
      />
    </div>
  );
}