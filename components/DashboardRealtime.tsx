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
    <div>
      <LiveUpdatePill show={pinged} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => {
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
        <div className="mb-6 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {pendingAll} booking{pendingAll > 1 ? "s" : ""} awaiting your approval
              </p>
              <p className="text-xs text-amber-600">
                Review and take action from the Approvals page
              </p>
            </div>
          </div>
          <Link
            href="/approvals"
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
          >
            Review <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="card overflow-hidden animate-slide-up">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display font-semibold text-slate-900">Recent Bookings</h2>
          <Link
            href="/bookings"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No bookings yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Create your first booking to get started.
            </p>
            <Link
              href="/bookings/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-semibold rounded-xl text-white transition-colors"
              style={{ background: "#0D1A38" }}
            >
              <CalendarPlus className="w-4 h-4" /> New Booking
            </Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Venue</th>
                <th>Date & Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
             {recent.map((ev) => {
    // Normalize the venue object
    const venue = Array.isArray(ev.venues) ? ev.venues[0] : ev.venues;

    return (
      <tr key={ev.id}>
        <td className="font-medium text-slate-900">{ev.title}</td>
        <td className="text-slate-500">{venue?.name ?? "—"}</td>
        <td className="text-slate-500 whitespace-nowrap">
          {formatDateTime(ev.start_time)}
        </td>
        <td>
          <StatusBadge status={ev.status} />
        </td>
      </tr>
    );
  })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}