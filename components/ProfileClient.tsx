"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { formatDate } from "@/utils/format";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Mail,
  Building,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  CalendarDays,
  LogOut,
} from "lucide-react";
import { ProfileData } from "@/utils/queries";
import ConfirmModal from "@/components/ConfirmModal"; 

/* ── Role badge colours ───────────────────────────────────── */
const ROLE_STYLES: Record<string, string> = {
  admin: "bg-purple-50 text-purple-700 border-purple-200",
  hod:   "bg-amber-50  text-amber-700  border-amber-200",
  user:  "bg-blue-50   text-blue-700   border-blue-200",
};

interface Stats {
  total:    number;
  approved: number;
  pending:  number;
  rejected: number;
}

interface ProfileClientProps {
  profile:   ProfileData;
  email:     string;
  createdAt: string;
  stats:     Stats;
}

export default function ProfileClient({
  profile,
  email,
  createdAt,
  stats,
}: ProfileClientProps) {
  const router   = useRouter();
  const supabase = createClient();

  const { avatarUrl, initials: contextInitials } = useAuth();

  /* ── Personal info state ─────────────────────────────────── */
  const [fullName,   setFullName]   = useState(profile.full_name   ?? "");
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoMsg,    setInfoMsg]    = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── Password state ──────────────────────────────────────── */
  const [currentPwd,  setCurrentPwd]  = useState("");
  const [newPwd,      setNewPwd]      = useState("");
  const [confirmPwd,  setConfirmPwd]  = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdSaving,   setPwdSaving]   = useState(false);
  const [pwdMsg,      setPwdMsg]      = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── Sign out all state ──────────────────────────────────── */
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false); 

  /* ── Role Details ────────────────────────────────────────── */
  const roleName = profile.roles?.name ?? "user";
  const roleLabel = profile.roles?.label ?? "General User";
  const roleStyle = ROLE_STYLES[roleName] ?? ROLE_STYLES.user;

  /* ── Save personal info ──────────────────────────────────── */
  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setInfoMsg(null);
    setInfoSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name:  fullName.trim(),
        })
        .eq("id", profile.id);

      if (error) throw error;
      setInfoMsg({ type: "success", text: "Profile updated successfully." });
      router.refresh();
    } catch (err) {
      setInfoMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update profile.",
      });
    } finally {
      setInfoSaving(false);
    }
  }

  /* ── Change password ─────────────────────────────────────── */
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);

    if (newPwd.length < 6) {
      setPwdMsg({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPwd === currentPwd) {
      setPwdMsg({ type: "error", text: "New password must differ from your current password." });
      return;
    }

    setPwdSaving(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: currentPwd,
      });
      if (signInErr) throw new Error("Current password is incorrect.");

      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPwd,
      });
      if (updateErr) throw updateErr;

      setPwdMsg({ type: "success", text: "Password changed successfully." });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      setPwdMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to change password.",
      });
    } finally {
      setPwdSaving(false);
    }
  }

  /* ── Execute Sign out all devices ────────────────────────── */
  async function executeSignOutAll() {
    setSigningOutAll(true);
    await supabase.auth.signOut({ scope: "global" });
    setShowSignOutModal(false);
    router.push("/");
  }

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="max-w-3xl space-y-4 sm:space-y-6 w-full">

      {/* ── Avatar / identity header ────────────────────────── */}
      <div className="card p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left w-full">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-md overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            contextInitials || "U"
          )}
        </div>

        <div className="flex-1 min-w-0 w-full">
          <h2 className="text-xl font-display font-bold text-slate-900 break-words">
            {profile.username ?? "—"}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 break-words">{email}</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 sm:mt-3 flex-wrap w-full">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleStyle}`}
            >
              <Shield className="w-3 h-3 shrink-0" />
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="text-center sm:text-right shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-slate-100 sm:border-0">
          <p className="text-xs text-slate-400">Member since</p>
          <p className="text-sm font-semibold text-slate-700 mt-0.5">
            {formatDate(createdAt)}
          </p>
        </div>
      </div>

      {/* ── Booking stats ────────────────────────────────────── */}
      <div className="card p-4 sm:p-6 w-full">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
          Booking summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
          {[
            { label: "Total submitted", value: stats.total,    color: "text-slate-900" },
            { label: "Approved",        value: stats.approved, color: "text-emerald-600" },
            { label: "Pending",         value: stats.pending,  color: "text-amber-600"  },
            { label: "Rejected",        value: stats.rejected, color: "text-red-600"    },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-100 w-full">
              <div className={`text-2xl sm:text-3xl font-display font-bold ${s.color}`}>
                {s.value}
              </div>
              <div className="text-xs text-slate-500 mt-1 break-words">{s.label}</div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 mt-4 flex items-start gap-1.5 leading-relaxed">
          <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Your role is <strong className="text-slate-600">{roleLabel}</strong>.
            Roles are assigned by a System Administrator and cannot be changed here.
          </span>
        </p>
      </div>

      {/* ── Personal information form ────────────────────────── */}
      <div className="card overflow-hidden w-full">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <h3 className="text-sm font-semibold text-slate-900 break-words">
            Personal information
          </h3>
        </div>

        <form onSubmit={saveInfo} className="p-4 sm:p-6 space-y-4 w-full">
          {infoMsg && (
            <Feedback type={infoMsg.type} text={infoMsg.text} />
          )}

          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 break-words">
              Email address
            </label>
            <div className="relative w-full">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                disabled
                value={email}
                className="field-input !pl-9 bg-slate-50 text-slate-400 cursor-not-allowed w-full text-sm sm:text-base py-2.5 sm:py-2"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5 break-words">
              Email address cannot be changed. Contact your administrator if needed.
            </p>
          </div>

          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 break-words">
              Username *
            </label>
            <div className="relative w-full">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Jane Smith"
                className="field-input !pl-9 w-full text-sm sm:text-base py-2.5 sm:py-2"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 w-full">
            <button
              type="submit"
              disabled={infoSaving}
              className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 w-full sm:w-auto text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.98]"
              style={{ background: "#0D1A38" }}
            >
              {infoSaving ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <Save className="w-4 h-4 shrink-0" />
              )}
              {infoSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Change password ──────────────────────────────────── */}
      <div className="card overflow-hidden w-full">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400 shrink-0" />
          <h3 className="text-sm font-semibold text-slate-900 break-words">
            Change password
          </h3>
        </div>

        <form onSubmit={changePassword} className="p-4 sm:p-6 space-y-4 w-full">
          {pwdMsg && (
            <Feedback type={pwdMsg.type} text={pwdMsg.text} />
          )}

          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 break-words">
              Current password *
            </label>
            <PasswordField
              value={currentPwd}
              onChange={setCurrentPwd}
              show={showCurrent}
              onToggle={() => setShowCurrent((p) => !p)}
              placeholder="Enter your current password"
            />
          </div>

          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 break-words">
              New password *
            </label>
            <PasswordField
              value={newPwd}
              onChange={setNewPwd}
              show={showNew}
              onToggle={() => setShowNew((p) => !p)}
              placeholder="At least 6 characters"
            />
          </div>

          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 break-words">
              Confirm new password *
            </label>
            <PasswordField
              value={confirmPwd}
              onChange={setConfirmPwd}
              show={showConfirm}
              onToggle={() => setShowConfirm((p) => !p)}
              placeholder="Repeat your new password"
              hasError={
                confirmPwd.length > 0 && newPwd !== confirmPwd
              }
            />
            {confirmPwd.length > 0 && newPwd !== confirmPwd && (
              <p className="text-xs text-red-500 mt-1.5 break-words">
                Passwords do not match
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2 w-full">
            <button
              type="submit"
              disabled={
                pwdSaving ||
                !currentPwd ||
                !newPwd ||
                !confirmPwd ||
                newPwd !== confirmPwd
              }
              className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 w-full sm:w-auto text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm active:scale-[0.98]"
              style={{ background: "#0D1A38" }}
            >
              {pwdSaving ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <Lock className="w-4 h-4 shrink-0" />
              )}
              {pwdSaving ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Danger zone ──────────────────────────────────────── */}
      <div className="card overflow-hidden border-red-200 w-full">
        <div className="px-4 sm:px-6 py-4 border-b border-red-100 bg-red-50/50">
          <h3 className="text-sm font-semibold text-red-800 break-words">Danger zone</h3>
          <p className="text-xs text-red-500 mt-0.5 break-words">
            These actions affect your account security
          </p>
        </div>
        <div className="p-4 sm:p-6 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
            <div className="w-full sm:flex-1">
              <p className="text-sm font-semibold text-slate-900 break-words">
                Sign out of all devices
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">
                Immediately invalidates every active session across all
                browsers and devices. You will need to sign in again on
                this device after.
              </p>
            </div>
            
            <button
              onClick={() => setShowSignOutModal(true)}
              disabled={signingOutAll}
              className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 w-full sm:w-auto text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0 active:scale-[0.98]"
            >
              {signingOutAll ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <LogOut className="w-4 h-4 shrink-0" />
              )}
              Sign out all
            </button>
          </div>
        </div>
      </div>

      
      <ConfirmModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={executeSignOutAll}
        title="Sign out everywhere?"
        message="This will immediately invalidate every active session across all browsers and devices. You will need to sign in again to continue."
        confirmText="Yes, Sign out"
        cancelText="Cancel"
        type="danger"
        loading={signingOutAll}
      />
    </div>
  );
}

/* ── Shared sub-components ───────────────────────────────── */
function Feedback({
  type,
  text,
}: {
  type: "success" | "error";
  text: string;
}) {
  const isSuccess = type === "success";
  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm animate-fade-in border w-full ${
        isSuccess
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-red-50 border-red-200 text-red-700"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      )}
      <span className="break-words w-full">{text}</span>
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  hasError = false,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  hasError?: boolean;
}) {
  return (
    <div className="relative w-full">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        required
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`field-input !pl-9 pr-12 w-full text-sm sm:text-base py-2.5 sm:py-2 ${
          hasError ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""
        }`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center p-1"
      >
        {show ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}