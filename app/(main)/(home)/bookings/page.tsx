import { redirect } from 'next/navigation';
import { formatDateTime } from "@/utils/format";
import { StatusBadge } from "@/utils/status-badge";
import BookingActions from '@/components/BookingActions';
import Link from 'next/link';
import { CalendarPlus, CalendarDays } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { Database } from '@/types/database.types';

type BookingWithRelations = Database['public']['Tables']['events']['Row'] & {
  venues: {
    name: string;
    location: string | null;
  } | null;
  event_resources: Array<{
    quantity_requested: number;
    resources: {
      name: string;
    } | null;
  }>;
};

export const metadata = { title: 'My Bookings — ESRMS' };

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: bookings } = await supabase
    .from('events')
    .select(`id, title, description, status, start_time, end_time, created_at, rejection_reason,
             venues(name, location), event_resources(quantity_requested, resources(name))`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const items = (bookings ?? []) as unknown as BookingWithRelations[];

  return (
    <div className="animate-fade-in">
      
      {/* 1. Header is now responsive: stacks on mobile, side-by-side on desktop */}
      <div className="page-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1 w-full pr-4">
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">Track and manage all your booking requests</p>
        </div>
        <Link href="/bookings/new"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm w-full sm:w-auto justify-center shrink-0"
          style={{ background: '#0D1A38' }}>
          <CalendarPlus className="w-4 h-4" /> New Booking
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="card px-6 py-20 text-center">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-semibold text-slate-700">No bookings found</p>
          <Link href="/bookings/new"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 text-sm font-semibold text-white rounded-xl w-full sm:w-auto justify-center"
            style={{ background: '#0D1A38' }}>
            <CalendarPlus className="w-4 h-4" /> Create First Booking
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(bk => <BookingCard key={bk.id} booking={bk} />)}
        </div>
      )}
      
    </div>
  );
}

function BookingCard({ booking: bk }: { booking: BookingWithRelations }) {
  const resources = bk.event_resources ?? [];
  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      {/* 2. Made the card content stack vertically on mobile so actions/buttons don't get squished */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        
        <div className="flex-1 min-w-0 w-full">
          {/* 3. Title and badge wrap safely if the title is very long on a small screen */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
            <h3 className="font-display font-semibold text-slate-900 text-base truncate max-w-full">{bk.title}</h3>
            <StatusBadge status={bk.status} />
          </div>
          
          {bk.description && <p className="text-sm text-slate-500 mb-3 line-clamp-1">{bk.description}</p>}
          
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
            <span><span className="font-semibold text-slate-700">Venue:</span> {bk.venues?.name ?? '—'}</span>
            <span><span className="font-semibold text-slate-700">From:</span> {formatDateTime(bk.start_time)}</span>
            <span><span className="font-semibold text-slate-700">To:</span> {formatDateTime(bk.end_time)}</span>
          </div>
          
          {resources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {resources.map(r => (
                <span key={r.resources?.name} className="px-2 py-0.5 rounded-md bg-slate-100 text-xs text-slate-600 font-medium">
                  {r.resources?.name} × {r.quantity_requested}
                </span>
              ))}
            </div>
          )}
          
          {bk.status === 'rejected' && bk.rejection_reason && (
            <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <span className="font-semibold">Rejection reason:</span> {bk.rejection_reason}
            </p>
          )}
        </div>

        {/* 4. Action buttons stretch to full width on mobile, sit neatly on the right on desktop */}
        {bk.status === 'pending' && (
          <div className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
            <BookingActions bookingId={bk.id} />
          </div>
        )}
        
      </div>
      
      <div className="mt-4 sm:mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
        Submitted {formatDateTime(bk.created_at)}
      </div>
    </div>
  );
}