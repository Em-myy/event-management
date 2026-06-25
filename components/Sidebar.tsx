"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Tables } from "@/types/supabase-helpers";
import {
  LayoutDashboard,
  CalendarPlus,
  CalendarDays,
  CheckSquare,
  Settings,
  LogOut,
  Calendar,
  ChevronRight,
  Menu,
  X,
  UserCircle,
} from "lucide-react";

/* ── Interfaces ───────────────────────────────────────────── */
// Adjust this type based on whether you are using the Layout's Profile type or Tables<"profiles">
type Profile = Tables<"profiles"> & {
  roles?: { label: string };
};

interface SidebarProps {
  profile: Profile | null;
  initialPendingCount?: number; // Made optional with a default value
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  minRole: number;
  showBadge?: boolean;
}

/* ── Constants ────────────────────────────────────────────── */
const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, minRole: 1 },
  { href: "/bookings", label: "My Bookings", icon: CalendarDays, minRole: 1 },
  { href: "/bookings/new", label: "New Booking", icon: CalendarPlus, minRole: 1 },
  { href: "/approvals", label: "Approvals", icon: CheckSquare, minRole: 2, showBadge: true },
  { href: "/admin", label: "Admin Panel", icon: Settings, minRole: 3 },
  { href: "/profile",      label: "My Profile",  icon: UserCircle,     minRole: 1 },
];

const ROLE_LABELS: Record<number, string> = {
  1: "Lecturer / Student",
  2: "HOD / Coordinator",
  3: "Administrator",
};

export default function Sidebar({ profile, initialPendingCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const roleId = profile?.role_id ?? 1;

  // Pulling user details and logout functionality from AuthContext
  const { handleSignout, initials, avatarUrl, displayName } = useAuth();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(initialPendingCount);

  /* ── Live-update the Approvals badge ──────────────────────── */
  useEffect(() => {
    // Lecturers (Role 1) don't see Approvals, skip subscription
    if (roleId < 2) return;

    const supabase = createClient();

    async function refreshCount() {
      const { count } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      
      setPendingCount(count ?? 0);
    }

    const channel = supabase
      .channel("sidebar-pending-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        () => {
          refreshCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roleId]);

  return (
    <>
      {/* 1. Mobile Hamburger Button (Floating top-left) */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-[#0d1a38] rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* 2. Dark Overlay Backdrop for Mobile */}
      <div
        className={`fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* 3. The Sidebar (Fixed on mobile, static on desktop) */}
      <aside
        className={`sidebar fixed inset-y-0 left-0 z-50 w-64 shrink-0 flex flex-col h-full bg-[#0d1a38] border-r border-white/5 transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Section */}
        <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-md shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display text-white font-bold text-base leading-none">
                ESRMS
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 tracking-widest uppercase">
                Resource Mgmt
              </div>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">
            Navigation
          </div>
          
          {NAV.filter((n) => roleId >= n.minRole).map((item) => {
            // 1. Is it an exact match?
            const isExactMatch = pathname === item.href;

            // 2. Is it a parent match?
            const isParentMatch =
              pathname.startsWith(item.href + "/") &&
              !NAV.some((n) => n.href !== item.href && pathname.startsWith(n.href));

            const active = isExactMatch || isParentMatch;
            const Icon = item.icon;
            const displayBadge = item.showBadge && pendingCount > 0;

            return (
              <Link
                href={item.href}
                key={item.href}
                onClick={() => setIsOpen(false)} // Close sidebar on mobile after navigating
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                />
                
                <span className="flex-1">{item.label}</span>

                {/* Approvals Badge */}
                {displayBadge && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}

                {/* Active Chevron (Hidden if Badge is showing to prevent crowding) */}
                {active && !displayBadge && <ChevronRight className="w-3 h-3 text-amber-500" />}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initials || "U"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-200 truncate">
                {displayName || profile?.username || "User"}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {ROLE_LABELS[roleId] || profile?.roles?.label || "General User"}
              </div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                handleSignout();
              }}
              title="Sign out"
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}