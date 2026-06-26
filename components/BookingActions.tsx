"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Trash2, Loader2, Pencil, AlertTriangle } from "lucide-react";

interface BookingActionsProps {
  bookingId: string;
}

export default function BookingActions({ bookingId }: BookingActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Ensure the portal only renders on the client side to prevent Next.js hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleDelete() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", bookingId);
    
    if (error) {
      console.error("Delete error:", error);
      setLoading(false);
      return;
    }
    
    setShowModal(false);
    router.refresh();
  }

  // The modal UI extracted into a variable
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <div className="p-2 bg-red-50 rounded-full">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Cancel Booking?</h3>
        </div>
        
        <p className="text-sm text-slate-500 mb-6">
          Are you sure you want to cancel this request? This action cannot be undone and the slot will be freed up for others.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(false)}
            className="flex-1 cursor-pointer px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Keep it
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 flex cursor-pointer items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Cancel"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-1.5 w-full sm:w-auto mt-3 sm:mt-0">
        <Link
          href={`/bookings/${bookingId}/edit`}
          title="Edit booking"
          className="w-full sm:w-auto flex items-center justify-center py-2.5 sm:py-2 px-4 sm:px-2 bg-blue-50 sm:bg-transparent rounded-xl sm:rounded-lg text-blue-600 sm:text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
        >
          <Pencil className="w-4 h-4 shrink-0" />
          <span className="sm:hidden ml-2 text-sm font-semibold">Edit Booking</span>
        </Link>

        <button
          onClick={() => setShowModal(true)}
          title="Cancel booking"
          className="w-full cursor-pointer sm:w-auto flex items-center justify-center py-2.5 sm:py-2 px-4 sm:px-2 bg-red-50 sm:bg-transparent rounded-xl sm:rounded-lg text-red-600 sm:text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <Trash2 className="w-4 h-4 shrink-0" />
          <span className="sm:hidden ml-2 text-sm font-semibold">Cancel Booking</span>
        </button>
      </div>

      {/* Teleport the modal to the body so it overlaps EVERYTHING */}
      {showModal && mounted && createPortal(modalContent, document.body)}
    </>
  );
}