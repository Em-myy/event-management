"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, CheckCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  type?: "danger" | "success";
  showCancel?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  type = "danger",
  showCancel = true,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // Set colors based on the modal type
  const isDanger = type === "danger";
  const iconBg = isDanger ? "bg-red-50" : "bg-emerald-50";
  const iconColor = isDanger ? "text-red-500" : "text-emerald-500";
  const titleColor = isDanger ? "text-red-600" : "text-emerald-700";
  const btnColor = isDanger
    ? "bg-red-600 hover:bg-red-700"
    : "bg-emerald-600 hover:bg-emerald-700";
  const Icon = isDanger ? AlertTriangle : CheckCircle;

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in w-full">
      <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl animate-slide-up">
        <div className={`flex items-center gap-3 ${titleColor} mb-4`}>
          <div className={`p-2 rounded-full shrink-0 ${iconBg}`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <h3 className="text-lg sm:text-xl font-bold leading-tight wrap-break-word">
            {title}
          </h3>
        </div>

        <p className="text-sm text-slate-500 mb-6 whitespace-pre-wrap leading-relaxed wrap-break-word">
          {message}
        </p>

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          {showCancel && (
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 cursor-pointer px-4 py-3 sm:py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 flex cursor-pointer items-center justify-center gap-2 px-4 py-3 sm:py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 active:scale-[0.98] ${btnColor}`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
