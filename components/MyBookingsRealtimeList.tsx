// File: src/components/MyBookingsRealtimeList.tsx
"use client";

import Link from "next/link";
import { CalendarDays, CalendarPlus } from "lucide-react";
import { formatDateTime } from "@/utils/format";
import { StatusBadge } from "@/utils/status-badge";
import { useTableChangeRefresh } from "@/hooks/useTableChangeRefresh";
import LiveUpdatePill from "@/components/LiveUpdatePill";
import type { MyBooking } from "@/utils/queries";
import BookingActions from "./BookingActions";

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
    <div className="w-full">
      <LiveUpdatePill show={pinged} />

      {items.length === 0 ? (
        <div className="card px-4 sm:px-6 py-12 sm:py-20 text-center animate-slide-up w-full">
          <CalendarDays className="w-10 sm:w-12 h-10 sm:h-12 text-slate-300 mx-auto mb-3 sm:mb-4" />
          <p className="font-semibold text-slate-700 text-sm sm:text-base">No bookings found</p>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 mb-6">
            You haven&apos;t made any booking requests yet.
          </p>
          <Link
            href="/bookings/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 text-sm font-semibold text-white rounded-xl w-full sm:w-auto transition-all active:scale-[0.98]"
            style={{ background: "#0D1A38" }}
          >
            <CalendarPlus className="w-4 h-4 shrink-0" /> Create First Booking
          </Link>
        </div>
      ) : (
        <div className="space-y-4 w-full">
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
    <div className="card p-4 sm:p-5 animate-slide-up hover:shadow-md transition-shadow w-full">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 w-full">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1 sm:mb-2 w-full">
            <h3 className="font-display font-semibold text-slate-900 text-base break-words min-w-0">
              {bk.title}
            </h3>
            <StatusBadge status={bk.status} />
          </div>
          {bk.description && (
            <p className="text-sm text-slate-500 mb-3 break-words w-full">{bk.description}</p>
          )}
          <div className="flex flex-wrap gap-x-4 sm:gap-x-5 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 break-words">
              <span className="font-semibold text-slate-700">Venue:</span>
              {venue.name ?? "Not specified"}
              {venue.location && ` · ${venue.location}`}
            </span>
            <span className="flex items-center gap-1 break-words">
              <span className="font-semibold text-slate-700">From:</span>
              {formatDateTime(bk.start_time)}
            </span>
            <span className="flex items-center gap-1 break-words">
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
            <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 w-full break-words">
              <span className="font-semibold">Rejection reason:</span> {bk.rejection_reason}
            </p>
          )}
        </div>

        {bk.status === "pending" && (
          <div className="w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
            <BookingActions bookingId={bk.id} />
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 break-words">
        Submitted {formatDateTime(bk.created_at)}
      </div>
    </div>
  );
}