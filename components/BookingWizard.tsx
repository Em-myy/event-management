'use client';

import { useState }     from 'react';
import { useRouter }    from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { format }       from 'date-fns';
import {
  CalendarDays, MapPin, Package, ClipboardCheck,
  ChevronRight, ChevronLeft, Check, Loader2, AlertCircle, Users, Info,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Event Details',   icon: CalendarDays   },
  { id: 2, label: 'Select Venue',    icon: MapPin         },
  { id: 3, label: 'Resources',       icon: Package        },
  { id: 4, label: 'Review & Submit', icon: ClipboardCheck },
];

export default function BookingWizard() {
  const router   = useRouter();
  const supabase = createClient();

  const [step,      setStep]      = useState(1);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [details,   setDetails]   = useState({ title: '', description: '', date: '', start_time: '', end_time: '' });
  const [venues,    setVenues]    = useState([]);
  const [venue,     setVenue]     = useState(null);
  const [resources, setResources] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  async function goToVenueStep() {
    setError('');
    if (!details.title || !details.date || !details.start_time || !details.end_time)
      return setError('Please fill in all required fields.');
    const start = new Date(`${details.date}T${details.start_time}`);
    const end   = new Date(`${details.date}T${details.end_time}`);
    if (end <= start) return setError('End time must be after start time.');

    setLoading(true);
    const { data, error: err } = await supabase.rpc('get_available_venues', {
      p_start: start.toISOString(), p_end: end.toISOString(),
    });
    setLoading(false);
    if (err) return setError(err.message);
    setVenues(data ?? []);
    setStep(2);
  }

  async function goToResourceStep() {
    if (!venue) return setError('Please select a venue.');
    setError('');
    setLoading(true);
    const start = new Date(`${details.date}T${details.start_time}`);
    const end   = new Date(`${details.date}T${details.end_time}`);
    const { data, error: err } = await supabase.rpc('get_resource_availability', {
      p_start: start.toISOString(), p_end: end.toISOString(),
    });
    setLoading(false);
    if (err) return setError(err.message);
    setResources((data ?? []).map(r => ({ ...r, qty: 0 })));
    setStep(3);
  }

  async function submit() {
    setError('');
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const start = new Date(`${details.date}T${details.start_time}`);
      const end   = new Date(`${details.date}T${details.end_time}`);

      const { data: event, error: evErr } = await supabase.from('events').insert({
        title: details.title, description: details.description,
        user_id: user.id, venue_id: venue.id,
        start_time: start.toISOString(), end_time: end.toISOString(), status: 'pending',
      }).select().single();
      if (evErr) throw evErr;

      const toInsert = resources.filter(r => r.qty > 0).map(r => ({
        event_id: event.id, resource_id: r.id, quantity_requested: r.qty,
      }));
      if (toInsert.length > 0) {
        const { error: resErr } = await supabase.from('event_resources').insert(toInsert);
        if (resErr) throw resErr;
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.message ?? 'Submission failed.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) return (
    <div className="card p-12 text-center max-w-md mx-auto animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
        <Check className="w-8 h-8 text-emerald-600" />
      </div>
      <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">Booking Submitted!</h2>
      <p className="text-slate-500 text-sm mb-8">Your request is now pending approval from an HOD or Event Coordinator.</p>
      <button onClick={() => router.push('/bookings')}
        className="px-6 py-3 text-sm font-semibold text-white rounded-xl"
        style={{ background: '#0D1A38' }}>
        View My Bookings
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-200 -z-0" />
          <div className="absolute left-0 top-4 h-0.5 bg-amber-500 transition-all duration-500 -z-0"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
          {STEPS.map(s => {
            const done = step > s.id, active = step === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2 z-10">
                <div className={`step-dot ${active ? 'active' : done ? 'done' : 'upcoming'}`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : <span>{s.id}</span>}
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wide hidden sm:block ${
                  active ? 'text-amber-600' : done ? 'text-slate-600' : 'text-slate-400'
                }`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
        </div>
      )}

      <div className="card p-7 animate-fade-in">
        {step === 1 && <Step1 details={details} setDetails={setDetails} onNext={goToVenueStep} loading={loading} />}
        {step === 2 && <Step2 venues={venues} selected={venue} setSelected={setVenue} onBack={() => setStep(1)} onNext={goToResourceStep} loading={loading} />}
        {step === 3 && <Step3 resources={resources} setResources={setResources} onBack={() => setStep(2)} onNext={() => setStep(4)} />}
        {step === 4 && <Step4 details={details} venue={venue} resources={resources.filter(r => r.qty > 0)} onBack={() => setStep(3)} onSubmit={submit} loading={loading} />}
      </div>
    </div>
  );
}

function Step1({ details, setDetails, onNext, loading }) {
  const set   = (k, v) => setDetails(p => ({ ...p, [k]: v }));
  const today = format(new Date(), 'yyyy-MM-dd');
  return (
    <div>
      <SectionHeader icon={<CalendarDays className="w-5 h-5" />} title="Event Details" subtitle="Describe your event and set the schedule." />
      <div className="space-y-4 mt-6">
        <FormField label="Event Title *"><input className="field-input" value={details.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Annual Tech Symposium" /></FormField>
        <FormField label="Description"><textarea className="field-input min-h-[80px] resize-none" value={details.description} onChange={e => set('description', e.target.value)} placeholder="Brief description..." rows={3} /></FormField>
        <FormField label="Date *"><input className="field-input" type="date" min={today} value={details.date} onChange={e => set('date', e.target.value)} /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Time *"><input className="field-input" type="time" value={details.start_time} onChange={e => set('start_time', e.target.value)} /></FormField>
          <FormField label="End Time *"><input className="field-input" type="time" value={details.end_time} onChange={e => set('end_time', e.target.value)} /></FormField>
        </div>
      </div>
      <NavButtons onNext={onNext} loading={loading} nextLabel="Check Availability" />
    </div>
  );
}

function Step2({ venues, selected, setSelected, onBack, onNext, loading }) {
  return (
    <div>
      <SectionHeader icon={<MapPin className="w-5 h-5" />} title="Select Venue"
        subtitle={venues.length === 0 ? 'No venues available for this time slot.' : `${venues.length} venue${venues.length > 1 ? 's' : ''} available.`} />
      {venues.length === 0 ? (
        <div className="mt-6 text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
          <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">All venues are booked for this slot. Please go back and choose a different time.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {venues.map(v => (
            <button key={v.id} onClick={() => setSelected(v)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selected?.id === v.id ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{v.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{v.location}</div>
                  {v.description && <div className="text-xs text-slate-400 mt-1">{v.description}</div>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                    <Users className="w-3 h-3" /> {v.capacity}
                  </div>
                  {selected?.id === v.id && (
                    <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      <NavButtons onBack={onBack} onNext={onNext} loading={loading} nextDisabled={!selected} nextLabel="Select Resources" />
    </div>
  );
}

function Step3({ resources, setResources, onBack, onNext }) {
  const setQty = (id, qty) => setResources(r => r.map(x => x.id === id ? { ...x, qty } : x));
  return (
    <div>
      <SectionHeader icon={<Package className="w-5 h-5" />} title="Resource Allocation" subtitle="Select equipment needed. Quantities are capped at current availability." />
      <div className="mt-6 space-y-2">
        {resources.map(r => (
          <div key={r.id} className={`flex items-center gap-4 p-3.5 rounded-xl border transition-colors ${r.qty > 0 ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-white'}`}>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900">{r.name}</div>
              <div className="text-xs text-slate-500">
                <span className={r.available > 0 ? 'text-emerald-600' : 'text-red-500'}>{r.available} available</span>
                <span className="text-slate-400"> / {r.total_quantity} total</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setQty(r.id, Math.max(0, r.qty - 1))} disabled={r.qty === 0}
                className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 text-sm font-bold">−</button>
              <input type="number" min={0} max={r.available} value={r.qty}
                onChange={e => setQty(r.id, Math.min(r.available, Math.max(0, Number(e.target.value))))}
                className="w-12 text-center text-sm font-semibold border border-slate-300 rounded-lg py-1 outline-none focus:border-amber-500" />
              <button onClick={() => setQty(r.id, Math.min(r.available, r.qty + 1))} disabled={r.qty >= r.available || r.available === 0}
                className="w-7 h-7 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 text-sm font-bold">+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
        <Info className="w-3.5 h-3.5 shrink-0" /> Resources are optional. Leave all at 0 to proceed without equipment.
      </div>
      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Review Booking" />
    </div>
  );
}

function Step4({ details, venue, resources, onBack, onSubmit, loading }) {
  return (
    <div>
      <SectionHeader icon={<ClipboardCheck className="w-5 h-5" />} title="Review & Submit" subtitle="Confirm your details before submitting for approval." />
      <div className="mt-6 space-y-4">
        <ReviewSection title="Event Information">
          <Row label="Title"       value={details.title} />
          <Row label="Description" value={details.description || '—'} />
          <Row label="Date"        value={details.date} />
          <Row label="Start Time"  value={details.start_time} />
          <Row label="End Time"    value={details.end_time} />
        </ReviewSection>
        <ReviewSection title="Venue">
          <Row label="Name"     value={venue?.name} />
          <Row label="Location" value={venue?.location} />
          <Row label="Capacity" value={`${venue?.capacity} persons`} />
        </ReviewSection>
        <ReviewSection title={`Resources (${resources.length})`}>
          {resources.length === 0
            ? <p className="text-sm text-slate-400">No resources requested.</p>
            : resources.map(r => <Row key={r.id} label={r.name} value={`× ${r.qty}`} />)}
        </ReviewSection>
      </div>
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
        Your request will be submitted as <strong>Pending</strong> and requires HOD/Coordinator approval.
      </div>
      <NavButtons onBack={onBack} onNext={onSubmit} loading={loading}
        nextLabel="Submit for Approval" nextClass="bg-emerald-600 hover:bg-emerald-700 text-white" />
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 shrink-0" style={{ background: '#0D1A38' }}>{icon}</div>
      <div>
        <h2 className="font-display font-bold text-slate-900 text-lg">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function NavButtons({ onBack, onNext, loading, nextLabel = 'Next', nextDisabled = false, nextClass }) {
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
      {onBack ? (
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      ) : <div />}
      <button onClick={onNext} disabled={loading || nextDisabled}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-sm ${nextClass ?? 'text-white'}`}
        style={!nextClass ? { background: '#0D1A38' } : undefined}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {nextLabel}
        {!loading && <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  );
}

function ReviewSection({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">{title}</h4>
      </div>
      <div className="px-4 py-3 space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-900 font-medium text-right">{value}</span>
    </div>
  );
}