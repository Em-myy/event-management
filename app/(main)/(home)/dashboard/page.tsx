import { redirect } from 'next/navigation';
import { formatDateTime } from "@/utils/format";
import { StatusBadge } from "@/utils/status-badge";
import { CalendarDays, CheckCircle2, Clock, XCircle, ArrowRight, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export const metadata = { title: 'Dashboard — ESRMS' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles').select('*, roles(name)').eq('id', user.id).single();

  const isStaff = (profile?.role_id ?? 1) >= 2;

  const [ownQuery, pendingQuery, recentQuery] = await Promise.all([
    supabase.from('events').select('status').eq('user_id', user.id),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('events')
      .select('id, title, status, start_time, end_time, venues(name)')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
  ]);

  const own = ownQuery.data ?? [];
  const approved = own.filter(e => e.status === 'approved').length;
  const pending = own.filter(e => e.status === 'pending').length;
  const rejected = own.filter(e => e.status === 'rejected').length;
  const pendingAll = pendingQuery.count ?? 0;
  const recent = recentQuery.data ?? [];

  const stats = [
    { label: 'Total Bookings', value: own.length, icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Approved', value: approved, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Pending', value: pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Rejected', value: rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="animate-fade-in">
      
     <div className="page-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Added min-w-0 to prevent the text from forcing the container to grow */}
        <div className="min-w-0 flex-1 w-full pr-4 pl-16 sm:pl-0">
          <p className="text-slate-500 text-sm font-medium">{greeting},</p>
          
          {/* Added break-all to force long emails to wrap to the next line on small screens */}
          <h1 className="page-title break-all sm:break-normal">
            {profile?.full_name ?? user.email}
          </h1>
          
          <p className="page-subtitle">
            {profile?.roles?.name === 'admin' ? 'System Administrator' : profile?.roles?.name === 'hod' ? 'HOD / Coordinator' : 'General User'}
          </p>
        </div>
        
        <Link href="/bookings/new"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm w-full sm:w-auto justify-center shrink-0"
          style={{ background: '#0D1A38' }}>
          <CalendarPlus className="w-4 h-4" /> New Booking
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card animate-slide-up">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="text-3xl font-display font-bold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      {isStaff && pendingAll > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">{pendingAll} booking{pendingAll > 1 ? 's' : ''} awaiting your approval</p>
              <p className="text-xs text-amber-600">Review from the Approvals page</p>
            </div>
          </div>
          <Link href="/approvals" className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 self-end sm:self-auto">
            Review <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="card overflow-hidden animate-slide-up">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display font-semibold text-slate-900">Recent Bookings</h2>
          <Link href="/bookings" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No bookings yet</p>
            <Link href="/bookings/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-semibold rounded-xl text-white"
              style={{ background: '#0D1A38' }}>
              <CalendarPlus className="w-4 h-4" /> New Booking
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="data-table w-full whitespace-nowrap sm:whitespace-normal">
              <thead><tr><th>Event</th><th>Venue</th><th>Date & Time</th><th>Status</th></tr></thead>
              <tbody>
                {recent.map(ev => (
                  <tr key={ev.id}>
                    <td className="font-medium text-slate-900">{ev.title}</td>
                    <td className="text-slate-500">{ev.venues?.[0]?.name ?? '—'}</td>
                    <td className="text-slate-500 whitespace-nowrap">{formatDateTime(ev.start_time)}</td>
                    <td><StatusBadge status={ev.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
    </div>
  );
}