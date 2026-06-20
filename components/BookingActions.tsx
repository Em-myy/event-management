'use client';

import { useState }     from 'react';
import { useRouter }    from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface ApprovalButtonsProps {
  bookingId: string;
}

export default function BookingActions({ bookingId }: ApprovalButtonsProps) {
  const [loading, setLoading] = useState(false);
  const router   = useRouter();

  async function handleDelete() {
    if (!confirm('Cancel this booking request?')) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from('events').delete().eq('id', bookingId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button onClick={handleDelete} disabled={loading} title="Cancel booking"
      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}