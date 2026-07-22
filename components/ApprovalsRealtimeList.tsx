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
    <div className="w-full">
      <LiveUpdatePill show={pinged} />

      {bookings.length > 0 && (
        <div className="inline-flex items-center gap-2 mb-4 sm:mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold text-amber-700">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            {bookings.length} request{bookings.length > 1 ? "s" : ""} awaiting
            review
          </span>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="card px-4 sm:px-6 py-12 sm:py-20 text-center w-full">
          <CheckSquare className="w-10 sm:w-12 h-10 sm:h-12 text-emerald-300 mx-auto mb-3 sm:mb-4" />
          <p className="font-semibold text-slate-700 text-sm sm:text-base">
            All caught up!
          </p>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            No pending booking requests at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5 w-full">
          {bookings.map((bk) => {
            const resources = bk.event_resources ?? [];
            const requester = Array.isArray(bk.profiles)
              ? bk.profiles[0]
              : bk.profiles;
            const venue = Array.isArray(bk.venues) ? bk.venues[0] : bk.venues;
            return (
              <div
                key={bk.id}
                className="card p-4 sm:p-6 animate-slide-up w-full"
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-4 sm:gap-6 w-full">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 w-full">
                      <h3 className="font-display font-bold text-slate-900 text-base sm:text-lg wrap-break-word min-w-0">
                        {bk.title}
                      </h3>
                      <StatusBadge status={bk.status} />
                    </div>

                    {bk.description && (
                      <p className="text-sm text-slate-500 mb-4 wrap-break-word w-full">
                        {bk.description}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                      <InfoCard label="Requester">
                        <p className="font-semibold text-slate-900 wrap-break-word">
                          {requester?.username ?? "—"}
                        </p>
                        <p className="text-slate-500 text-xs wrap-break-word">
                          {requester?.email}
                        </p>
                      </InfoCard>

                      <InfoCard label="Schedule">
                        <p className="font-semibold text-slate-900 wrap-break-word">
                          {formatDateTime(bk.start_time)}
                        </p>
                        <p className="text-slate-500 text-xs wrap-break-word">
                          to {formatDateTime(bk.end_time)}
                        </p>
                      </InfoCard>

                      <InfoCard label="Venue">
                        <p className="font-semibold text-slate-900 wrap-break-word">
                          {venue.name ?? "—"}
                        </p>
                        <p className="text-slate-500 text-xs wrap-break-word">
                          {venue.location}
                        </p>
                        {venue.capacity && (
                          <p className="text-slate-400 text-xs wrap-break-word">
                            Capacity: {venue.capacity}
                          </p>
                        )}
                      </InfoCard>

                      {resources.length > 0 && (
                        <InfoCard label={`Resources (${resources.length})`}>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {resources.map((r, idx) => {
                              // Normalize the nested resource object
                              const resObj = Array.isArray(r.resources)
                                ? r.resources[0]
                                : r.resources;

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

                    <p className="text-xs text-slate-400 mt-4 wrap-break-word">
                      Submitted {formatDateTime(bk.created_at)}
                    </p>
                  </div>

                  <div className="w-full md:w-auto shrink-0 mt-2 md:mt-0">
                    <ApprovalButtons bookingId={bk.id} />
                  </div>
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
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 w-full min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 wrap-break-word">
        {label}
      </p>
      {children}
    </div>
  );
}
