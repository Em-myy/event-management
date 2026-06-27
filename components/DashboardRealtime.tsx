// File: src/components/DashboardRealtime.tsx
"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  CalendarPlus,
} from "lucide-react";
import { formatDateTime } from "@/utils/format";
import { StatusBadge } from "@/utils/status-badge";
import { useTableChangeRefresh } from "@/hooks/useTableChangeRefresh";
import LiveUpdatePill from "@/components/LiveUpdatePill";
import type { RecentBooking } from "@/utils/queries";

interface Stats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

interface DashboardRealtimeProps {
  userId: string;
  isStaff: boolean;
  initialStats: Stats;
  initialPendingAll: number;
  initialRecent: RecentBooking[];
}

export default function DashboardRealtime({
  userId,
  isStaff,
  initialStats,
  initialPendingAll,
  initialRecent,
}: DashboardRealtimeProps) {
  const { pinged } = useTableChangeRefresh({
    table: "events",
    channelName: `dashboard-events-${userId}`,
  });

  const stats = initialStats;
  const pendingAll = initialPendingAll;
  const recent = initialRecent;

  const statCards = [
    { label: "Total Bookings", value: stats.total, icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  ];

  return (
    <div className="w-full">
      <LiveUpdatePill show={pinged} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8 w-full">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card animate-slide-up w-full p-4 sm:p-5">
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
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:px-5 sm:py-4 animate-slide-up w-full">
          <div className="flex items-start sm:items-center gap-3 w-full">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 break-words">
                {pendingAll} booking{pendingAll > 1 ? "s" : ""} awaiting your approval
              </p>
              <p className="text-xs text-amber-600 break-words mt-0.5 sm:mt-0">
                Review and take action from the Approvals page
              </p>
            </div>
          </div>
          <Link
            href="/approvals"
            className="flex items-center justify-end sm:justify-start gap-1.5 text-sm sm:text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors w-full sm:w-auto mt-2 sm:mt-0 active:scale-[0.98]"
          >
            Review <ArrowRight className="w-3 sm:w-4 h-3 sm:h-4" />
          </Link>
        </div>
      )}

      <div className="card overflow-hidden animate-slide-up w-full">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display font-semibold text-slate-900 text-base sm:text-lg">Recent Bookings</h2>
          <Link
            href="/bookings"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 active:scale-[0.98]"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="px-4 sm:px-6 py-12 sm:py-16 text-center w-full">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No bookings yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Create your first booking to get started.
            </p>
            <Link
              href="/bookings/new"
              className="inline-flex items-center justify-center gap-2 mt-4 px-5 py-2.5 sm:py-2 text-sm font-semibold rounded-xl text-white transition-colors active:scale-[0.98] w-full sm:w-auto"
              style={{ background: "#0D1A38" }}
            >
              <CalendarPlus className="w-4 h-4 shrink-0" /> New Booking
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="data-table w-full text-left whitespace-nowrap min-w-[600px]">
              <thead>
                <tr>
                  <th className="px-4 sm:px-6 py-3">Event</th>
                  <th className="px-4 sm:px-6 py-3">Venue</th>
                  <th className="px-4 sm:px-6 py-3">Date & Time</th>
                  <th className="px-4 sm:px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
               {recent.map((ev) => {
                // Normalize the venue object
                const venue = Array.isArray(ev.venues) ? ev.venues[0] : ev.venues;

                return (
                  <tr key={ev.id} className="border-t border-slate-100">
                    <td className="px-4 sm:px-6 py-3 font-medium text-slate-900">{ev.title}</td>
                    <td className="px-4 sm:px-6 py-3 text-slate-500">{venue?.name ?? "—"}</td>
                    <td className="px-4 sm:px-6 py-3 text-slate-500 whitespace-nowrap">
                      {formatDateTime(ev.start_time)}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <StatusBadge status={ev.status} />
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}