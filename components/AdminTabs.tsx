'use client';

import { useState } from 'react';
import AdminInvitePanel from '@/components/AdminInvitePanel';
import ConfirmModal from '@/components/ConfirmModal'; 
import {
  Plus, Pencil, Trash2, Save, X,
  Loader2, Building2, Package, Users, MailPlus,
  CalendarDays,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/database.types';
import type { 
  AdminVenue, 
  AdminResource, 
  AdminUser, 
  AdminInvite, 
  AdminBooking 
} from "@/utils/queries";
import { useTableChangeRefresh } from "@/hooks/useTableChangeRefresh";
import LiveUpdatePill            from "@/components/LiveUpdatePill";
import { StatusBadge } from '@/utils/status-badge';
import { formatDateTime } from '@/utils/format';
import ApprovalButtons from './ApprovalButtons';
import { useAuth } from "@/context/AuthContext";

type Venue = Database['public']['Tables']['venues']['Row'];
type Resource = Database['public']['Tables']['resources']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

/* ── Tab definitions ────────────────────────────────────────── */
type TabId = "venues" | "resources" | "users" | "invites" | "bookings";

const TABS: { id: TabId; label: string; icon: typeof Building2 }[] = [
  { id: "venues",    label: "Venues",       icon: Building2  },
  { id: "resources", label: "Resources",    icon: Package    },
  { id: "users",     label: "Users",        icon: Users      },
  { id: "invites",   label: "Invites",      icon: MailPlus   },
  { id: "bookings",  label: "All Bookings", icon: CalendarDays },
];

/* ── Root component ─────────────────────────────────────────── */
interface AdminTabsProps {
  initialVenues: AdminVenue[];
  initialResources: AdminResource[];
  initialUsers: AdminUser[];
  initialInvites: AdminInvite[];
  initialBookings: AdminBooking[];
}

export default function AdminTabs({
  initialVenues,
  initialResources,
  initialUsers,
  initialInvites,
  initialBookings,
}: AdminTabsProps) {
  const [tab, setTab] = useState("venues");

  return (
    <div className="w-full">
      {/* Tab bar */}
      <div className="flex overflow-x-auto gap-1 bg-slate-200 p-1 rounded-xl mb-6 w-full min-w-0 hide-scrollbar">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                tab === t.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panels */}
      {tab === 'venues'    && <VenuesTab    initial={initialVenues}    />}
      {tab === 'resources' && <ResourcesTab initial={initialResources} />}
      {tab === 'users'     && <UsersTab     initial={initialUsers}     />}
      {tab === 'invites'   && <AdminInvitePanel initialInvites={initialInvites} />}
      {tab === 'bookings'  && <AllBookingsTab initial={initialBookings} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VENUES TAB
═══════════════════════════════════════════════════════════════ */
function VenuesTab({ initial }: { initial: Venue[] }) {
  const supabase = createClient();
  const [items, setItems] = useState<Venue[]>(initial);
  const [editing, setEditing] = useState<Partial<Venue> | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Modal States
  const [venueToDelete, setVenueToDelete] = useState<Venue | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null); 

  const blank: Partial<Venue> = { name: '', location: '', capacity: 0, description: '', is_active: true };

  async function save(form: Partial<Venue>) {
    setLoading(true);
    try {
      if (form.id) {
        const { data, error } = await supabase
          .from('venues')
          .update({
            name: form.name, 
            location: form.location,
            capacity: Number(form.capacity), 
            description: form.description,
            is_active: form.is_active,
          })
          .eq('id', form.id)
          .select()
          .single();
          
        if (error) throw error;
        setItems(p => p.map(x => x.id === data.id ? data : x));
      } else {
        const { data, error } = await supabase
          .from('venues')
          .insert({
            name: form.name!, 
            location: form.location,
            capacity: Number(form.capacity), 
            description: form.description,
          })
          .select()
          .single();
          
        if (error) throw error;
        setItems(p => [...p, data]);
      }
      setEditing(null);
    } catch (err) {
      console.error(err);
      setAlertMsg('There was an error saving the venue. Please try again.'); 
    } finally { 
      setLoading(false); 
    }
  }

  async function executeDelete() {
    if (!venueToDelete) return;
    setIsDeleting(true);
    try {
      await supabase.from('venues').delete().eq('id', venueToDelete.id);
      setItems(p => p.filter(x => x.id !== venueToDelete.id));
    } catch (err) {
      console.error("Error deleting venue", err);
      setAlertMsg('Failed to delete venue. It might be in use by an existing booking.');
    } finally {
      setIsDeleting(false);
      setVenueToDelete(null);
    }
  }

  async function toggleActive(item: Venue) {
    const { data, error } = await supabase
      .from('venues')
      .update({ is_active: !item.is_active })
      .eq('id', item.id)
      .select()
      .single();
      
    if (error) {
      console.error(error);
      return setAlertMsg('Failed to update venue status.');
    }
    setItems(p => p.map(x => x.id === data.id ? data : x));
  }

  return (
    <div className="w-full animate-fade-in">
      <div className="flex justify-end mb-4">
        <button onClick={() => setEditing(blank)}
          className="flex items-center justify-center gap-2 cursor-pointer px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm hover:opacity-90 w-full sm:w-auto active:scale-[0.98] transition-all"
          style={{ background: '#0D1A38' }}>
          <Plus className="w-4 h-4" /> Add Venue
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="data-table w-full text-left whitespace-nowrap min-w-[700px]">
            <thead>
              <tr>
                <th className="px-4 sm:px-6 py-3">Name</th>
                <th className="px-4 sm:px-6 py-3">Location</th>
                <th className="px-4 sm:px-6 py-3">Capacity</th>
                <th className="px-4 sm:px-6 py-3">Status</th>
                <th className="px-4 sm:px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(v => (
                <tr key={v.id} className="border-t border-slate-100">
                  <td className="px-4 sm:px-6 py-3 font-medium text-slate-900">
                    {v.name}
                    {v.description && (
                      <div className="text-xs text-slate-400 font-normal mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                        {v.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-slate-500">{v.location || '—'}</td>
                  <td className="px-4 sm:px-6 py-3">{v.capacity}</td>
                  <td className="px-4 sm:px-6 py-3">
                    <button onClick={() => toggleActive(v)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                        v.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}>
                      {v.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditing(v)}
                        className="p-1.5 cursor-pointer rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setVenueToDelete(v)}
                        className="p-1.5 cursor-pointer rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <FormModal
          title={editing.id ? 'Edit Venue' : 'Add Venue'}
          fields={[
            { key: 'name',        label: 'Name *',      type: 'text'   },
            { key: 'location',    label: 'Location',    type: 'text'   },
            { key: 'capacity',    label: 'Capacity *',  type: 'number' },
            { key: 'description', label: 'Description', type: 'text'   },
          ]}
          data={editing} loading={loading}
          onSave={save} onClose={() => setEditing(null)}
        />
      )}

      
      <ConfirmModal 
        isOpen={venueToDelete !== null}
        onClose={() => setVenueToDelete(null)}
        onConfirm={executeDelete}
        title="Delete Venue?"
        message={`Are you sure you want to delete "${venueToDelete?.name}"?\n\nThis action cannot be undone.`}
        confirmText="Yes, Delete"
        loading={isDeleting}
      />

      
      <ConfirmModal 
        isOpen={alertMsg !== null}
        onClose={() => setAlertMsg(null)}
        onConfirm={() => setAlertMsg(null)}
        title="Action Failed"
        message={alertMsg ?? ""}
        confirmText="Understood"
        type="danger"
        showCancel={false} 
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESOURCES TAB
═══════════════════════════════════════════════════════════════ */
function ResourcesTab({ initial }: { initial: Resource[] }) {
  const supabase = createClient();
  const [items, setItems] = useState<Resource[]>(initial);
  const [editing, setEditing] = useState<Partial<Resource> | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null); // ✅ Error Alert State

  const blank: Partial<Resource> = { name: '', description: '', total_quantity: 0, condition: 'Good', is_active: true };

  async function save(form: Partial<Resource>) {
    setLoading(true);
    try {
      if (form.id) {
        const { data, error } = await supabase
          .from('resources')
          .update({
            name: form.name, 
            description: form.description,
            total_quantity: Number(form.total_quantity),
            condition: form.condition, 
            is_active: form.is_active,
          })
          .eq('id', form.id)
          .select()
          .single();
          
        if (error) throw error;
        setItems(p => p.map(x => x.id === data.id ? data : x));
      } else {
        const { data, error } = await supabase
          .from('resources')
          .insert({
            name: form.name!, 
            description: form.description,
            total_quantity: Number(form.total_quantity), 
            condition: form.condition,
          })
          .select()
          .single();
          
        if (error) throw error;
        setItems(p => [...p, data]);
      }
      setEditing(null);
    } catch (err) {
      console.error(err);
      setAlertMsg('There was an error saving the resource. Please try again.'); // ✅ Modal instead of alert()
    } finally { 
      setLoading(false); 
    }
  }

  async function executeDelete() {
    if (!resourceToDelete) return;
    setIsDeleting(true);
    try {
      await supabase.from('resources').delete().eq('id', resourceToDelete.id);
      setItems(p => p.filter(x => x.id !== resourceToDelete.id));
    } catch (err) {
      console.error("Error deleting resource", err);
      setAlertMsg('Failed to delete resource. It might be allocated to an existing booking.'); // ✅ Modal instead of alert()
    } finally {
      setIsDeleting(false);
      setResourceToDelete(null);
    }
  }

  const conditionColor: Record<string, string> = {
    Good: 'bg-emerald-50 text-emerald-700',
    Fair: 'bg-amber-50 text-amber-700',
    Poor: 'bg-red-50 text-red-700',
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="flex justify-end mb-4">
        <button onClick={() => setEditing(blank)}
          className="flex items-center justify-center gap-2 cursor-pointer px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm hover:opacity-90 w-full sm:w-auto active:scale-[0.98] transition-all"
          style={{ background: '#0D1A38' }}>
          <Plus className="w-4 h-4" /> Add Resource
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="data-table w-full text-left whitespace-nowrap min-w-[700px]">
            <thead>
              <tr>
                <th className="px-4 sm:px-6 py-3">Name</th>
                <th className="px-4 sm:px-6 py-3">Total Qty</th>
                <th className="px-4 sm:px-6 py-3">Condition</th>
                <th className="px-4 sm:px-6 py-3">Status</th>
                <th className="px-4 sm:px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 sm:px-6 py-3 font-medium text-slate-900">
                    {r.name}
                    {r.description && (
                      <div className="text-xs text-slate-400 font-normal mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                        {r.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3">{r.total_quantity}</td>
                  <td className="px-4 sm:px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${conditionColor[r.condition!] ?? conditionColor.Good}`}>
                      {r.condition}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      r.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {r.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditing(r)}
                        className="p-1.5 cursor-pointer rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setResourceToDelete(r)}
                        className="p-1.5 cursor-pointer rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <FormModal
          title={editing.id ? 'Edit Resource' : 'Add Resource'}
          fields={[
            { key: 'name',           label: 'Name *',      type: 'text'   },
            { key: 'description',    label: 'Description', type: 'text'   },
            { key: 'total_quantity', label: 'Total Qty *', type: 'number' },
            { key: 'condition',      label: 'Condition',   type: 'select',
              options: ['Good', 'Fair', 'Poor'] },
          ]}
          data={editing} loading={loading}
          onSave={save} onClose={() => setEditing(null)}
        />
      )}

      
      <ConfirmModal 
        isOpen={resourceToDelete !== null}
        onClose={() => setResourceToDelete(null)}
        onConfirm={executeDelete}
        title="Delete Resource?"
        message={`Are you sure you want to delete "${resourceToDelete?.name}"?\n\nThis action cannot be undone.`}
        confirmText="Yes, Delete"
        loading={isDeleting}
      />

      
      <ConfirmModal 
        isOpen={alertMsg !== null}
        onClose={() => setAlertMsg(null)}
        onConfirm={() => setAlertMsg(null)}
        title="Action Failed"
        message={alertMsg ?? ""}
        confirmText="Understood"
        type="danger"
        showCancel={false} 
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   USERS TAB
═══════════════════════════════════════════════════════════════ */
function UsersTab({ initial }: { initial: Profile[] }) {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>(initial);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [alertMsg, setAlertMsg] = useState<string | null>(null); 
  const { user: currentUser, loading: authLoading } = useAuth();

  async function updateRole(userId: string, newRoleId: string) {
    setLoading(p => ({ ...p, [userId]: true }));
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role_id: Number(newRoleId) } as any) 
        .eq('id', userId)
        .select('*, roles(name, label)')
        .single();
        
      if (error) throw error;
      setUsers(p => p.map(u => u.id === data.id ? (data as unknown as Profile) : u));
    } catch (err) {
      console.log(err);
      setAlertMsg('Failed to update user role. Please try again.'); 
    } finally {
      setLoading(p => ({ ...p, [userId]: false }));
    }
  }

  return (
    <div className="card overflow-hidden w-full animate-fade-in">
      <div className="overflow-x-auto w-full">
        <table className="data-table w-full text-left whitespace-nowrap min-w-[600px]">
          <thead>
            <tr>
              <th className="px-4 sm:px-6 py-3">Name</th>
              <th className="px-4 sm:px-6 py-3">Email</th>
              <th className="px-4 sm:px-6 py-3">Role Assignment</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isMe = currentUser?.id === u.id;
              return (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 sm:px-6 py-3 font-medium text-slate-900">
                  {u.username || '—'}
                  {isMe && (
                      <span className="ml-3 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        You
                      </span>
                    )}
                  </td>
                <td className="px-4 sm:px-6 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 sm:px-6 py-3">
                  <div className="flex items-center gap-2">
                      {authLoading ? (
                        // ✅ Show a tiny spinner while we figure out who is logged in
                        <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
                      ) : isMe ? (
                        // ✅ If it's your account, just show the role text.
                        <span className="text-xs font-semibold text-slate-500 px-2.5 py-1.5">
                          Administrator
                        </span>
                      ) : (
                        // ✅ If it's a normal user, show the dropdown
                        <select
                          value={u.role_id || 1}
                          onChange={e => updateRole(u.id, e.target.value)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold outline-none cursor-pointer hover:border-slate-400 transition-colors w-full sm:w-auto"
                        >
                          <option value={1}>General User</option>
                          <option value={2}>HOD / Coordinator</option>
                          <option value={3}>Administrator</option>
                        </select>
                      )}
                      
                      {/* This is your existing spinner for the database update */}
                      {loading[u.id] && (
                        <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin shrink-0" />
                      )}
                    </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      
      <ConfirmModal 
        isOpen={alertMsg !== null}
        onClose={() => setAlertMsg(null)}
        onConfirm={() => setAlertMsg(null)}
        title="Action Failed"
        message={alertMsg ?? ""}
        confirmText="Understood"
        type="danger"
        showCancel={false} 
      />
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   ALL BOOKINGS TAB
═══════════════════════════════════════════════════════════════ */
function AllBookingsTab({ initial }: { initial: AdminBooking[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  /* Live updates — admin sees new bookings without refreshing */
  const { pinged } = useTableChangeRefresh({
    table:       "events",
    channelName: "admin-all-bookings",
  });

  const filtered = initial
    .filter((b) => filter === "all" || b.status === filter)
    .filter((b) => {
      const requester = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
      const venue = Array.isArray(b.venues) ? b.venues[0] : b.venues;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        requester.username?.toLowerCase().includes(q) ||
        requester.email?.toLowerCase().includes(q) ||
        venue.name?.toLowerCase().includes(q)
      );
    });

  const counts = {
    all:      initial.length,
    pending:  initial.filter((b) => b.status === "pending").length,
    approved: initial.filter((b) => b.status === "approved").length,
    rejected: initial.filter((b) => b.status === "rejected").length,
  };

  return (
    <div className="w-full animate-fade-in">
      <LiveUpdatePill show={pinged} />

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-4 w-full">
        <div className="relative flex-1 w-full sm:w-auto min-w-[200px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, requester, or venue..."
            className="field-input !pl-9 text-xs w-full"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {(
            [
              { key: "all",      label: "All"      },
              { key: "pending",  label: "Pending"  },
              { key: "approved", label: "Approved" },
              { key: "rejected", label: "Rejected" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filter === f.key
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
              }`}
            >
              {f.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                filter === f.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* No bookings at all in the system */}
      {initial.length === 0 && (
        <div className="card px-4 sm:px-6 py-10 sm:py-16 text-center w-full">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">
            No bookings in the system yet
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Bookings will appear here once users start submitting requests.
          </p>
        </div>
      )}

      {/* Bookings exist but search/filter returned nothing */}
      {initial.length > 0 && filtered.length === 0 && (
        <div className="card px-4 sm:px-6 py-10 sm:py-16 text-center w-full">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">
            No bookings match your filter
          </p>
          <button
            onClick={() => { setFilter("all"); setSearch(""); }}
            className="text-xs text-blue-600 hover:text-blue-800 mt-2 underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Booking cards */}
      {filtered.length > 0 && (
        <div className="space-y-4 w-full">
          {filtered.map((bk) => {
            const requester = Array.isArray(bk.profiles) ? bk.profiles[0] : bk.profiles;
            const resources = bk.event_resources ?? [];
            const venue = Array.isArray(bk.venues) ? bk.venues[0] : bk.venues;
            return (
              <div key={bk.id} className="card p-4 sm:p-5 w-full">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 w-full">

                    {/* Title + status */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap w-full">
                      <h3 className="font-display font-bold text-slate-900 text-base break-words min-w-0">
                        {bk.title}
                      </h3>
                      <StatusBadge status={bk.status} />
                    </div>

                    {bk.description && (
                      <p className="text-sm text-slate-500 mb-3 line-clamp-1 w-full break-words">
                        {bk.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap gap-x-4 sm:gap-x-5 gap-y-2 text-xs text-slate-500 mb-2">
                      <span className="break-words">
                        <span className="font-semibold text-slate-700">Submitted by:</span>{" "}
                        {requester?.username ?? "—"}
                        {requester?.email && (
                          <span className="text-slate-400 hidden sm:inline"> · {requester.email}</span>
                        )}
                      </span>
                      <span>
                        <span className="font-semibold text-slate-700">Venue:</span>{" "}
                        {venue.name ?? "—"}
                      </span>
                      <span>
                        <span className="font-semibold text-slate-700">From:</span>{" "}
                        {formatDateTime(bk.start_time)}
                      </span>
                      <span>
                        <span className="font-semibold text-slate-700">To:</span>{" "}
                        {formatDateTime(bk.end_time)}
                      </span>
                    </div>

                    {/* Resources */}
                    {resources.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2 mt-1">
                        {resources.map((r, idx) => {
                           const resObj = Array.isArray(r.resources) ? r.resources[0] : r.resources;
                           return (
                          <span
                            key={`${resObj?.name}-${idx}`}
                            className="px-2 py-0.5 bg-slate-100 text-xs rounded-md text-slate-600 font-medium"
                          >
                             {resObj?.name} × {r.quantity_requested}
                          </span>
                           );
                      })}
                      </div>
                    )}

                    {/* Rejection reason */}
                    {bk.status === "rejected" && bk.rejection_reason && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-2 w-full break-words">
                        <span className="font-semibold">Rejection reason:</span>{" "}
                        {bk.rejection_reason}
                      </p>
                    )}

                    <p className="text-xs text-slate-400 mt-2">
                      Submitted {formatDateTime(bk.created_at)}
                    </p>
                  </div>

                  {/* Approve / Reject only for pending */}
                  {bk.status === "pending" && (
                    <div className="w-full sm:w-auto mt-2 sm:mt-0">
                      <ApprovalButtons bookingId={bk.id} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REUSABLE FORM MODAL
═══════════════════════════════════════════════════════════════ */
interface FormField {
  key: string;
  label: string;
  type: string;
  options?: string[];
}

interface FormModalProps {
  title: string;
  fields: FormField[];
  data: any;
  loading: boolean;
  onSave: (form: any) => void;
  onClose: () => void;
}

function FormModal({ title, fields, data, loading, onSave, onClose }: FormModalProps) {
  const [form, setForm] = useState({ ...data });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 sm:p-6 w-full"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-4 sm:p-6 animate-slide-up max-h-full overflow-y-auto">

        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <h3 className="font-display font-bold text-slate-900 text-lg sm:text-xl break-words">{title}</h3>
          <button onClick={onClose}
            className="p-1.5 cursor-pointer rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                {f.label}
              </label>
              {f.type === 'select' ? (
                <select value={form[f.key] ?? ''}
                  onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                  className="field-input w-full p-2.5 sm:p-2 border rounded text-sm sm:text-base">
                  {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type} value={form[f.key] ?? ''}
                  onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                  className="field-input w-full p-2.5 sm:p-2 border rounded text-sm sm:text-base" />
              )}
            </div>
          ))}

          {typeof form.is_active !== 'undefined' && (
            <label className="flex items-center gap-2.5 mt-2">
              <input type="checkbox" checked={form.is_active}
                onChange={e => setForm((p: any) => ({ ...p, is_active: e.target.checked }))}
                className="w-4 h-4 accent-slate-800 rounded cursor-pointer shrink-0" />
              <span className="text-sm text-slate-700">Active (visible to users)</span>
            </label>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 sm:mt-8">
          <button onClick={onClose}
            className="flex-1 py-3 sm:py-2.5 cursor-pointer text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors active:scale-[0.98]">
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={loading}
            className="flex-1 py-3 sm:py-2.5 cursor-pointer text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
            style={{ background: '#0D1A38' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
        
      </div>
    </div>
  );
}