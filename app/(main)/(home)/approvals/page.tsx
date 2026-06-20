import { redirect }      from 'next/navigation';
import { formatDateTime } from "@/utils/format";
import { StatusBadge } from "@/utils/status-badge";
import ApprovalButtons   from '@/components/ApprovalButtons';
import { CheckSquare, Clock } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { Database } from '@/types/database.types';

type ApprovalBookingWithRelations = Database['public']['Tables']['events']['Row'] & {
  profiles: {
    username: string | null;
    email: string | null;
  } | null;
  venues: {
    name: string;
    location: string | null;
    capacity: number;
  } | null;
  event_resources: Array<{
    quantity_requested: number;
    resources: {
      name: string;
    } | null;
  }>;
}

export const metadata = { title: 'Approvals — ESRMS' };

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase.from('profiles').select('role_id').eq('id', user.id).single();
  if (!profile || profile.role_id < 2) redirect('/dashboard');

  const { data: pending } = await supabase
    .from('events')
    .select(`id, title, description, status, start_time, end_time, created_at,
             profiles!events_user_id_fkey(full_name, email, department),
             venues(name, location, capacity),
             event_resources(quantity_requested, resources(name))`)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const bookings = (pending ?? []) as unknown as ApprovalBookingWithRelations[];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Pending Approvals</h1>
        <p className="page-subtitle">Review and action booking requests awaiting your decision</p>
      </div>

      {bookings.length > 0 && (
        <div className="inline-flex items-center gap-2 mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm font-semibold text-amber-700">
          <Clock className="w-4 h-4" />
          {bookings.length} request{bookings.length > 1 ? 's' : ''} awaiting review
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="card px-6 py-20 text-center">
          <CheckSquare className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
          <p className="font-semibold text-slate-700">All caught up!</p>
          <p className="text-sm text-slate-400 mt-1">No pending requests at this time.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {bookings.map(bk => {
            const resources = bk.event_resources ?? [];
            const requester = bk.profiles;
            return (
              <div key={bk.id} className="card p-6 animate-slide-up">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display font-bold text-slate-900 text-lg">{bk.title}</h3>
                      <StatusBadge status={bk.status} />
                    </div>
                    {bk.description && <p className="text-sm text-slate-500 mb-4">{bk.description}</p>}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <InfoCard label="Requester">
                        <p className="font-semibold text-slate-900">{requester?.username ?? '—'}</p>
                        <p className="text-slate-500 text-xs">{requester?.email}</p>
                      </InfoCard>
                      <InfoCard label="Schedule">
                        <p className="font-semibold text-slate-900">{formatDateTime(bk.start_time)}</p>
                        <p className="text-slate-500 text-xs">to {formatDateTime(bk.end_time)}</p>
                      </InfoCard>
                      <InfoCard label="Venue">
                        <p className="font-semibold text-slate-900">{bk.venues?.name ?? '—'}</p>
                        <p className="text-slate-500 text-xs">{bk.venues?.location}</p>
                      </InfoCard>
                      {resources.length > 0 && (
                        <InfoCard label={`Resources (${resources.length})`}>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {resources.map(r => (
                              <span key={r.resources?.name} className="px-2 py-0.5 bg-slate-100 text-xs rounded-md text-slate-700 font-medium">
                                {r.resources?.name} × {r.quantity_requested}
                              </span>
                            ))}
                          </div>
                        </InfoCard>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-4">Submitted {formatDateTime(bk.created_at)}</p>
                  </div>
                  <ApprovalButtons bookingId={bk.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      {children}
    </div>
  );
}