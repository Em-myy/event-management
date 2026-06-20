'use client';

import { useState } from 'react';
import AdminInvitePanel, { InviteRecord } from '@/components/AdminInvitePanel';
import {
  Plus, Pencil, Trash2, Save, X,
  Loader2, Building2, Package, Users, MailPlus,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/database.types';

type Venue = Database['public']['Tables']['venues']['Row'];
type Resource = Database['public']['Tables']['resources']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

/* ── Tab definitions ────────────────────────────────────────── */
const TABS = [
  { id: 'venues',    label: 'Venues',    icon: Building2 },
  { id: 'resources', label: 'Resources', icon: Package   },
  { id: 'users',     label: 'Users',     icon: Users     },
  { id: 'invites',   label: 'Invites',   icon: MailPlus  },
] as const;

type TabId = typeof TABS[number]['id'];

/* ── Root component ─────────────────────────────────────────── */
interface AdminTabsProps {
  initialVenues?: Venue[];
  initialResources?: Resource[];
  initialUsers?: Profile[];
  initialInvites?: InviteRecord[]; 
}

export default function AdminTabs({
  initialVenues = [],
  initialResources = [],
  initialUsers = [],
  initialInvites = [],
}: AdminTabsProps) {
  const [tab, setTab] = useState<TabId>('venues');

  return (
    <div>
      {/* Tab bar - Added flex-wrap and w-full for mobile wrapping */}
      <div className="flex flex-wrap sm:flex-nowrap gap-1 bg-slate-200 p-1 rounded-xl mb-6 w-full sm:w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
                tab === t.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-300/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panels */}
      {tab === 'venues'    && <VenuesTab    initial={initialVenues}    />}
      {tab === 'resources' && <ResourcesTab initial={initialResources} />}
      {tab === 'users'     && <UsersTab     initial={initialUsers}     />}
      {tab === 'invites'   && <AdminInvitePanel initialInvites={initialInvites} />}
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
      alert('Error saving venue');
    } finally { 
      setLoading(false); 
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this venue? This cannot be undone.')) return;
    await supabase.from('venues').delete().eq('id', id);
    setItems(p => p.filter(x => x.id !== id));
  }

  async function toggleActive(item: Venue) {
    const { data, error } = await supabase
      .from('venues')
      .update({ is_active: !item.is_active })
      .eq('id', item.id)
      .select()
      .single();
      
    if (error) return console.error(error);
    setItems(p => p.map(x => x.id === data.id ? data : x));
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        {/* Full width button on mobile */}
        <button onClick={() => setEditing(blank)}
          className="flex items-center justify-center gap-2 cursor-pointer px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm hover:opacity-90 w-full sm:w-auto"
          style={{ background: '#0D1A38' }}>
          <Plus className="w-4 h-4" /> Add Venue
        </button>
      </div>

      <div className="card overflow-hidden">
        {/* Added overflow container and whitespace-nowrap */}
        <div className="overflow-x-auto w-full">
          <table className="data-table w-full text-left whitespace-nowrap">
            <thead>
              <tr>
                <th>Name</th><th>Location</th><th>Capacity</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(v => (
                <tr key={v.id}>
                  <td className="font-medium text-slate-900">
                    {v.name}
                    {v.description && (
                      <div className="text-xs text-slate-400 font-normal mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                        {v.description}
                      </div>
                    )}
                  </td>
                  <td className="text-slate-500">{v.location || '—'}</td>
                  <td>{v.capacity}</td>
                  <td>
                    <button onClick={() => toggleActive(v)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                        v.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}>
                      {v.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditing(v)}
                        className="p-1.5 cursor-pointer rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(v.id)}
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
      alert('Error saving resource');
    } finally { 
      setLoading(false); 
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this resource?')) return;
    await supabase.from('resources').delete().eq('id', id);
    setItems(p => p.filter(x => x.id !== id));
  }

  const conditionColor: Record<string, string> = {
    Good: 'bg-emerald-50 text-emerald-700',
    Fair: 'bg-amber-50 text-amber-700',
    Poor: 'bg-red-50 text-red-700',
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        {/* Full width button on mobile */}
        <button onClick={() => setEditing(blank)}
          className="flex items-center justify-center gap-2 cursor-pointer px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm hover:opacity-90 w-full sm:w-auto"
          style={{ background: '#0D1A38' }}>
          <Plus className="w-4 h-4" /> Add Resource
        </button>
      </div>

      <div className="card overflow-hidden">
        {/* Added overflow container and whitespace-nowrap */}
        <div className="overflow-x-auto w-full">
          <table className="data-table w-full text-left whitespace-nowrap">
            <thead>
              <tr>
                <th>Name</th><th>Total Qty</th><th>Condition</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id}>
                  <td className="font-medium text-slate-900">
                    {r.name}
                    {r.description && (
                      <div className="text-xs text-slate-400 font-normal mt-0.5 truncate max-w-[200px] sm:max-w-xs">
                        {r.description}
                      </div>
                    )}
                  </td>
                  <td>{r.total_quantity}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${conditionColor[r.condition!] ?? conditionColor.Good}`}>
                      {r.condition}
                    </span>
                  </td>
                  <td>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      r.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {r.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditing(r)}
                        className="p-1.5 cursor-pointer rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(r.id)}
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
      console.error(err);
      alert('Failed to update user role');
    } finally {
      setLoading(p => ({ ...p, [userId]: false }));
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Added overflow container and whitespace-nowrap */}
      <div className="overflow-x-auto w-full">
        <table className="data-table w-full text-left whitespace-nowrap">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role Assignment</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="font-medium text-slate-900">{u.username || '—'}</td>
                <td className="text-slate-500">{u.email}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role_id || 1}
                      onChange={e => updateRole(u.id, e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold outline-none cursor-pointer hover:border-slate-400 transition-colors"
                    >
                      <option value={1}>General User</option>
                      <option value={2}>HOD / Coordinator</option>
                      <option value={3}>Administrator</option>
                    </select>
                    {loading[u.id] && (
                      <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6"
      onClick={e => e.target === e.currentTarget && onClose()}>
      {/* Modal adjusts well to mobile screens natively, but ensured it doesn't overflow height */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up max-h-full overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-slate-900 text-lg">{title}</h3>
          <button onClick={onClose}
            className="p-1.5 cursor-pointer rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
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
                  className="field-input w-full p-2 border rounded">
                  {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type} value={form[f.key] ?? ''}
                  onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}
                  className="field-input w-full p-2 border rounded" />
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

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
          <button onClick={onClose}
            className="flex-1 py-2.5 cursor-pointer text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={loading}
            className="flex-1 py-2.5 cursor-pointer text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: '#0D1A38' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
        
      </div>
    </div>
  );
}