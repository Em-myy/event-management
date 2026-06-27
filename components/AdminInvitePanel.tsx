'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail, UserPlus, Send, RefreshCw, X,
  Clock, CheckCircle2, XCircle, Loader2,
  AlertCircle, ChevronDown, Info,
} from 'lucide-react';
import { formatDateTime } from "@/utils/format";
import type { AdminInvite } from "@/utils/queries";
import ConfirmModal from "@/components/ConfirmModal"; 
import { useTableChangeRefresh } from "@/hooks/useTableChangeRefresh";
import LiveUpdatePill from "@/components/LiveUpdatePill";

/* ── Types & Interfaces ───────────────────────────────────── */
export type InviteStatus = 'pending' | 'accepted' | 'cancelled' | 'expired';

interface AdminInvitePanelProps {
  initialInvites?: AdminInvite[]
}

const ROLES = [
  {
    value: 1,
    label: 'Lecturer / Student (General User)',
    desc:  'Can view the event calendar, create booking requests, and track their own submissions.',
  },
  {
    value: 2,
    label: 'HOD / Event Coordinator',
    desc:  'Everything a Lecturer can do, plus the ability to approve or reject booking requests.',
  },
];

const STATUS: Record<InviteStatus, { label: string; cls: string; Icon: React.ElementType }> = {
  pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200',   Icon: Clock },
  accepted:  { label: 'Accepted',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500 border-slate-200',   Icon: XCircle },
  expired:   { label: 'Expired',   cls: 'bg-red-50 text-red-600 border-red-200',         Icon: AlertCircle },
};

export default function AdminInvitePanel({ initialInvites = [] }: AdminInvitePanelProps) {
  const router = useRouter();

  const { pinged } = useTableChangeRefresh({
    table: "invites", 
    channelName: "admin-invites-channel",
  });

  const [email,      setEmail]      = useState('');
  const [roleId,     setRoleId]     = useState(1);
  const [roleOpen,   setRoleOpen]   = useState(false);

  const invites = initialInvites; 
  
  const [sending,  setSending]  = useState(false);
  const [actionId, setActionId] = useState<string | number | null>(null);
  const [success,  setSuccess]  = useState('');
  const [error,    setError]    = useState('');
  
  const [cancelTarget, setCancelTarget] = useState<{ id: string | number, email: string } | null>(null);

  const selectedRole = ROLES.find(r => r.value === roleId);

  function clearFeedback() { setSuccess(''); setError(''); }

  async function callApi(url: string, body: any) {
    const res  = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Request failed');
    return data;
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    clearFeedback();

    if (!email.trim()) {
      setError('Please enter an email address.');
      return;
    }

    setSending(true);
    try {
      const data = await callApi('/api/admin/invite', {
        email:      email.trim(),
        role_id:    roleId,
      });
      setSuccess(data.message);
      setEmail('');
      setRoleId(1);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSending(false);
    }
  }

  async function resend(inviteId: string | number) {
    clearFeedback();
    setActionId(inviteId);
    try {
      const data = await callApi('/api/admin/invite/resend', {
        invite_id: inviteId,
      });
      setSuccess(data.message);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend invite');
    } finally {
      setActionId(null);
    }
  }

  async function executeCancel() {
    if (!cancelTarget) return;
    
    clearFeedback();
    setActionId(cancelTarget.id);
    
    try {
      const data = await callApi('/api/admin/invite/cancel', {
        invite_id: cancelTarget.id,
      });
      setSuccess(data.message);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invite');
    } finally {
      setActionId(null);
      setCancelTarget(null);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in relative w-full">
      
      {/* ✅ Place the live update pill at the top of the component */}
      <LiveUpdatePill show={pinged} />

      {/* ════ Send Invite Card ════════════════════════════════ */}
      <div className="card overflow-visible">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-start sm:items-center gap-3 flex-col sm:flex-row">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#0D1A38' }}
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Send an invite
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              The user gets a secure sign-up link by email. Their role is applied automatically when they register.
            </p>
          </div>
        </div>

        <form onSubmit={sendInvite} className="p-4 sm:p-6">
          {success && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm mb-5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5 animate-fade-in">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Could not send invite</p>
                <p className="text-xs mt-0.5 opacity-80">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Email address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearFeedback(); }}
                  placeholder="staff@institution.edu"
                  className="field-input !pl-10 py-2 pr-3 w-full border rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Assign role *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleOpen(p => !p)}
                  className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-900 hover:border-slate-400 transition-colors text-left"
                >
                  <span className="truncate pr-4">{selectedRole?.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${roleOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {roleOpen && (
                  <div className="absolute z-30 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    {ROLES.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setRoleId(opt.value);
                          setRoleOpen(false);
                          clearFeedback();
                        }}
                        className={`w-full text-left px-4 py-3 transition-colors border-b border-slate-100 last:border-0 hover:bg-slate-50 ${roleId === opt.value ? 'bg-amber-50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{opt.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5 whitespace-normal">{opt.desc}</p>
                          </div>
                          {roleId === opt.value && (
                            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-5">
            <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">How it works: </span>
              Supabase emails a secure one-time sign-up link. When the user
              clicks it and creates their password, they are automatically
              assigned the role selected above — no manual update needed.
            </p>
          </div>

          <div className="flex justify-end mt-4 sm:mt-6">
            <button
              type="submit"
              disabled={sending}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
              style={{ background: '#0D1A38' }}
            >
              {sending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
              {sending ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>

      {/* ════ Invite History Table ════════════════════════════ */}
      <div className="card overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Invite history</h3>
          <span className="text-xs text-slate-400">{invites.length} total</span>
        </div>

        {invites.length === 0 ? (
          <div className="px-4 sm:px-6 py-10 sm:py-16 text-center">
            <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No invites sent yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Use the form above to invite lecturers and HODs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="data-table w-full text-left whitespace-nowrap min-w-[700px]">
              <thead>
                <tr>
                  <th className="px-4 sm:px-6 py-3">Email</th>
                  <th className="px-4 sm:px-6 py-3">Role assigned</th>
                  <th className="px-4 sm:px-6 py-3">Invited by</th>
                  <th className="px-4 sm:px-6 py-3">Date sent</th>
                  <th className="px-4 sm:px-6 py-3">Status</th>
                  <th className="px-4 sm:px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invites.map(inv => {
                  const cfg = STATUS[inv.status as InviteStatus] ?? STATUS.pending;
                  const inviter = Array.isArray(inv.profiles) ? inv.profiles[0] : inv.profiles;
                  
                  const { Icon }  = cfg;
                  const isActioning = actionId === inv.id;
                  const roleName  = inv.role_id === 2
                    ? 'HOD / Coordinator'
                    : 'Lecturer / Student';

                  return (
                    <tr key={inv.id} className="border-t border-slate-100">
                      <td className="px-4 sm:px-6 py-3 font-medium text-slate-900">{inv.email}</td>
                      <td className="px-4 sm:px-6 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            inv.role_id === 2
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {roleName}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-slate-500">{inviter?.username ?? 'Admin'}</td>
                      <td className="px-4 sm:px-6 py-3 text-slate-500">{formatDateTime(inv.created_at)}</td>
                      <td className="px-4 sm:px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        {inv.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => resend(inv.id)}
                              disabled={isActioning}
                              title="Resend invite email"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50"
                            >
                              {isActioning
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <RefreshCw className="w-3.5 h-3.5" />
                              }
                            </button>
                            <button
                              onClick={() => setCancelTarget({ id: inv.id, email: inv.email })}
                              disabled={isActioning}
                              title="Cancel invite"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {inv.status === 'accepted' && (
                          <span className="text-xs text-slate-400">
                            Joined {inv.accepted_at ? formatDateTime(inv.accepted_at) : ''}
                          </span>
                        )}

                        {['cancelled', 'expired'].includes(inv.status) && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={executeCancel}
        title="Cancel Invite?"
        message={`Are you sure you want to cancel the invite for ${cancelTarget?.email}?\n\nThey will no longer be able to use the existing link.`}
        confirmText="Yes, Cancel Invite"
        cancelText="Keep it"
        loading={actionId === cancelTarget?.id}
      />
    </div>
  );
}