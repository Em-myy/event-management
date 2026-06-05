"use client";

import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  CalendarDays,
  CalendarPlus,
  CheckSquare,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, minRole: 1 },
  { href: "/bookings", label: "My Bookings", icon: CalendarDays, minRole: 1 },
  {
    href: "/bookings/new",
    label: "New Bookings",
    icon: CalendarPlus,
    minRole: 1,
  },
  { href: "/approvals", label: "Approvals", icon: CheckSquare, minRole: 2 },
  { href: "/admin", label: "Admin Panel", icon: Settings, minRole: 3 },
];
const Sidebar = ({ profile }) => {
  const pathname = usePathname();
  const roleId = profile?.role_id ?? 1;

  const { handleLogout, initials, avatarUrl, displayName } = useAuth();

  return (
    <aside className="sidebar w-64 shrink-0 flex flex-col h-full border-r border-white/5">
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-md">
            <Calendar className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="font-family-display text-white font-bold text-base leading-none">
              ESRMS
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 tracking-widest uppercase">
              Resource Management
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-3">
          Navigation
        </div>
        {NAV.filter((n) => roleId >= n.minRole).map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              href={item.href}
              key={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${active ? "text-amber-400" : "text-slate-500 group-hover:text-slate-300"}`}
              />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 text-amber-500" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {avatarUrl || initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-500 truncate">
              {displayName}
            </div>
            <div className="text-[10px] text-slate-500 truncate"></div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <h1>Just writing the SQL in supabase</h1>
    </aside>
  );
};

export default Sidebar;
