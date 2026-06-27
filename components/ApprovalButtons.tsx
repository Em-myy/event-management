"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Check, X, Loader2, AlertCircle } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal"; 

interface ApprovalButtonsProps {
  bookingId: string;
}

export default function ApprovalButtons({ bookingId }: ApprovalButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false); 
  const [showRejectModal, setShowRejectModal] = useState(false);   
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function executeApprove() {
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");

      const { error: updateErr } = await supabase
        .from("events")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (updateErr) throw updateErr;
      
      setShowApproveModal(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve booking.");
    } finally {
      setLoading(false);
    }
  }

  async function executeReject() {
    if (!reason.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { error: updateErr } = await supabase
        .from("events")
        .update({
          status: "rejected",
          rejection_reason: reason.trim(),
        })
        .eq("id", bookingId);

      if (updateErr) throw updateErr;
      
      setShowRejectModal(false);
      setReason("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject booking.");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Extracted Reject Modal Content for Portal
  const rejectModalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 w-full animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && setShowRejectModal(false)}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 text-red-600">
          <div className="p-2 rounded-full bg-red-50 shrink-0 self-start sm:self-auto hidden sm:block">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold leading-tight text-red-600 break-words">
              Reject Booking
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 break-words">
              Provide a reason for the requester
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="break-words flex-1">{error}</span>
          </div>
        )}

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Venue unavailable due to maintenance..."
          rows={3}
          className="field-input resize-none w-full mb-6 border-slate-300 rounded-xl text-sm sm:text-base p-3"
        />

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={() => {
              setShowRejectModal(false);
              setReason("");
              setError("");
            }}
            disabled={loading}
            className="flex-1 py-3 sm:py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={executeReject}
            disabled={!reason.trim() || loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Reject Booking
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3 shrink-0">
        {error && !showRejectModal && !showApproveModal && (
          <div className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 w-full sm:max-w-[180px]">
            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
            <span className="break-words">{error}</span>
          </div>
        )}
        
        {/* Trigger Approve Modal */}
        <button
          onClick={() => setShowApproveModal(true)}
          disabled={loading}
          className="flex items-center justify-center w-full sm:w-auto gap-1.5 px-4 sm:px-3.5 py-3 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          <Check className="w-4 h-4" />
          Approve
        </button>

        {/* Trigger Reject Modal */}
        <button
          onClick={() => {
            setShowRejectModal(true);
            setError("");
          }}
          disabled={loading}
          className="flex items-center justify-center w-full sm:w-auto gap-1.5 px-4 sm:px-3.5 py-3 sm:py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl border border-red-200 transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          <X className="w-4 h-4" />
          Reject
        </button>
      </div>

    
      <ConfirmModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={executeApprove}
        title="Approve Booking?"
        message="Are you sure you want to approve this booking request? The requester will be notified."
        confirmText="Yes, Approve"
        cancelText="Cancel"
        type="success"
        loading={loading}
      />

      
      {showRejectModal && mounted && createPortal(rejectModalContent, document.body)}
    </>
  );
}