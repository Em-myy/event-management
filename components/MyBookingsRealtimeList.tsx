// File: src/components/MyBookingsRealtimeList.tsx
"use client";

import Link from "next/link";
import { CalendarDays, CalendarPlus } from "lucide-react";
import { formatDateTime } from "@/utils/format";
import { StatusBadge } from "@/utils/status-badge";
import BookingActions from "@/components/BookingActions";
import { useTableChangeRefresh } from "@/hooks/useTableChangeRefresh";
import LiveUpdatePill from "@/components/LiveUpdatePill";
import type { MyBooking } from "@/utils/queries";

interface Props {
  userId: string;
  initialBookings: MyBooking[];
}

export default function MyBookingsRealtimeList({ userId, initialBookings }: Props) {
  const { pinged } = useTableChangeRefresh({
    table: "events",
    channelName: `my-bookings-${userId}`,
    filter: `user_id=eq.${userId}`,
  });

  const items = initialBookings;

  return (
    <div>
      <LiveUpdatePill show={pinged} />

      {items.length === 0 ? (
        <div className="card px-6 py-20 text-center animate-slide-up">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-semibold text-slate-700">No bookings found</p>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            You haven&apos;t made any booking requests yet.
          </p>
          <Link
            href="/bookings/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
            style={{ background: "#0D1A38" }}
          >
            <CalendarPlus className="w-4 h-4" /> Create First Booking
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((bk) => (
            <BookingCard key={bk.id} booking={bk} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking: bk }: { booking: MyBooking }) {
  const resources = bk.event_resources ?? [];
  const venue = Array.isArray(bk.venues) ? bk.venues[0] : bk.venues;

  return (
    <div className="card p-5 animate-slide-up hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-display font-semibold text-slate-900 text-base truncate">
              {bk.title}
            </h3>
            <StatusBadge status={bk.status} />
          </div>
          {bk.description && (
            <p className="text-sm text-slate-500 mb-3 line-clamp-1">{bk.description}</p>
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-slate-700">Venue:</span>
              {venue.name ?? "Not specified"}
              {venue.location && ` · ${venue.location}`}
            </span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-slate-700">From:</span>
              {formatDateTime(bk.start_time)}
            </span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-slate-700">To:</span>
              {formatDateTime(bk.end_time)}
            </span>
          </div>

        {resources.length > 0 && (
  <div className="mt-3 flex flex-wrap gap-1.5">
    {resources.map((r, idx) => {
      // Normalize the nested resource object
      const resObj = Array.isArray(r.resources) ? r.resources[0] : r.resources;

      return (
        <span
          key={`${resObj?.name}-${idx}`}
          className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs text-slate-600 font-medium"
        >
          {resObj?.name} × {r.quantity_requested}
        </span>
      );
    })}
  </div>
)}

          {bk.status === "rejected" && bk.rejection_reason && (
            <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <span className="font-semibold">Rejection reason:</span> {bk.rejection_reason}
            </p>
          )}
        </div>

        {bk.status === "pending" && <BookingActions bookingId={bk.id} />}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
        Submitted {formatDateTime(bk.created_at)}
      </div>
    </div>
  );
}