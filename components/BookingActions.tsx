'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface ApprovalButtonsProps {
  bookingId: string;
}

export default function BookingActions({ bookingId }: ApprovalButtonsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('Cancel this booking request?')) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from('events').delete().eq('id', bookingId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={loading} 
      title="Cancel booking"
      className="w-full sm:w-auto flex items-center justify-center py-2.5 sm:py-2 px-4 sm:px-2 bg-red-50 sm:bg-transparent rounded-xl sm:rounded-lg text-red-600 sm:text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        <Trash2 className="w-4 h-4 shrink-0" />
      )}
      {/* This text only appears on mobile to make it a clear, full-width button */}
      <span className="sm:hidden ml-2 text-sm font-semibold">
        Cancel Booking
      </span>
    </button>
  );
}