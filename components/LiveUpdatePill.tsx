"use client";

import { Wifi } from "lucide-react";

export default function LiveUpdatePill({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg animate-fade-in">
      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
      List updated
    </div>
  );
}