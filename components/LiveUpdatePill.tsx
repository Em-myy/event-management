"use client";

import { Wifi } from "lucide-react";

export default function LiveUpdatePill({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 sm:top-5 sm:right-5 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs font-semibold px-3 py-2 sm:px-4 sm:py-2.5 rounded-full shadow-lg animate-fade-in pointer-events-none">
      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
      <span className="truncate">List updated</span>
    </div>
  );
}