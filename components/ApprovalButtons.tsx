'use client';

import { useState }     from 'react';
import { useRouter }    from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';

export default function ApprovalButtons({ bookingId }) {
  const [loading,   setLoading]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reason,    setReason]    = useState('');
  const router   = useRouter();
  const supabase = createClient();

  async function approve() {
    if (!confirm('Approve this booking?')) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('events').update({
      status: 'approved', approved_by: user.id, approved_at: new Date().toISOString(),
    }).eq('id', bookingId);
    router.refresh();
    setLoading(false);
  }

  async function reject() {
    if (!reason.trim()) return;
    setLoading(true);
    await supabase.from('events').update({ status: 'rejected', rejection_reason: reason.trim() }).eq('id', bookingId);
    setShowModal(false);
    setReason('');
    router.refresh();
    setLoading(false);
  }

  return (
    <>
      <div className="flex flex-col gap-2 shrink-0">
        <button onClick={approve} disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Approve
        </button>
        <button onClick={() => setShowModal(true)} disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl border border-red-200 transition-all">
          <X className="w-4 h-4" /> Reject
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900">Reject Booking</h3>
                <p className="text-xs text-slate-500">Provide a reason for the requester</p>
              </div>
            </div>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Venue unavailable due to maintenance, please choose another date..."
              rows={3} className="field-input resize-none w-full mb-4" />
            <div className="flex gap-3">
              <button onClick={() => { setShowModal(false); setReason(''); }}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl">
                Cancel
              </button>
              <button onClick={reject} disabled={!reason.trim() || loading}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}