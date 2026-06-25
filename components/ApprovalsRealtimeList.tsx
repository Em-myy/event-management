// File: src/components/ApprovalsRealtimeList.tsx
"use client";

import { formatDateTime } from "@/utils/format";
import { StatusBadge } from "@/utils/status-badge";
import ApprovalButtons from "@/components/ApprovalButtons";
import { CheckSquare, Clock } from "lucide-react";
import { useTableChangeRefresh } from "@/hooks/useTableChangeRefresh";
import LiveUpdatePill from "@/components/LiveUpdatePill";
import type { PendingBooking } from "@/utils/queries";

interface Props {
  initialBookings: PendingBooking[];
}

export default function ApprovalsRealtimeList({ initialBookings }: Props) {
  const { pinged } = useTableChangeRefresh({
    table: "events",
    channelName: "approvals-events-changes",
  });

  const bookings = initialBookings;

  return (
    <div>
      <LiveUpdatePill show={pinged} />

      {bookings.length > 0 && (
        <div className="inline-flex items-center gap-2 mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm font-semibold text-amber-700">
          <Clock className="w-4 h-4" />
          {bookings.length} request{bookings.length > 1 ? "s" : ""} awaiting review
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="card px-6 py-20 text-center">
          <CheckSquare className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
          <p className="font-semibold text-slate-700">All caught up!</p>
          <p className="text-sm text-slate-400 mt-1">
            No pending booking requests at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {bookings.map((bk) => {
            const resources = bk.event_resources ?? [];
            const requester = Array.isArray(bk.profiles) ? bk.profiles[0] : bk.profiles;
            const venue = Array.isArray(bk.venues) ? bk.venues[0] : bk.venues;
            return (
              <div key={bk.id} className="card p-6 animate-slide-up">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display font-bold text-slate-900 text-lg">
                        {bk.title}
                      </h3>
                      <StatusBadge status={bk.status} />
                    </div>

                    {bk.description && (
                      <p className="text-sm text-slate-500 mb-4">{bk.description}</p>
                    )}

                    <div className="grid sm:grid-cols-2 gap-3">
                      <InfoCard label="Requester">
                        <p className="font-semibold text-slate-900">
                          {requester?.username ?? "—"}
                        </p>
                        <p className="text-slate-500 text-xs">{requester?.email}</p>
                      </InfoCard>

                      <InfoCard label="Schedule">
                        <p className="font-semibold text-slate-900">
                          {formatDateTime(bk.start_time)}
                        </p>
                        <p className="text-slate-500 text-xs">
                          to {formatDateTime(bk.end_time)}
                        </p>
                      </InfoCard>

                      <InfoCard label="Venue">
                        <p className="font-semibold text-slate-900">
                          {venue.name ?? "—"}
                        </p>
                        <p className="text-slate-500 text-xs">{venue.location}</p>
                        {venue.capacity && (
                          <p className="text-slate-400 text-xs">
                            Capacity: {venue.capacity}
                          </p>
                        )}
                      </InfoCard>

                     {resources.length > 0 && (
  <InfoCard label={`Resources (${resources.length})`}>
    <div className="flex flex-wrap gap-1 mt-1">
      {resources.map((r, idx) => {
        // Normalize the nested resource object
        const resObj = Array.isArray(r.resources) ? r.resources[0] : r.resources;

        return (
          <span
            key={`${resObj?.name}-${idx}`}
            className="px-2 py-0.5 bg-slate-100 text-xs rounded-md text-slate-700 font-medium"
          >
            {resObj?.name} × {r.quantity_requested}
          </span>
        );
      })}
    </div>
  </InfoCard>
)}
                    </div>

                    <p className="text-xs text-slate-400 mt-4">
                      Submitted {formatDateTime(bk.created_at)}
                    </p>
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

function InfoCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      {children}
    </div>
  );
}