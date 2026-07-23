"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  CalendarDays,
  MapPin,
  Package,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  AlertCircle,
  Users,
  Info,
} from "lucide-react";
import type { EditableBooking } from "@/utils/queries";
import { formatDate, formatDateTime, formatTime } from "@/utils/format";

/* ── Step definitions ─────────────────────────────────────── */
const STEPS = [
  { id: 1, label: "Event Details", icon: CalendarDays },
  { id: 2, label: "Select Venue", icon: MapPin },
  { id: 3, label: "Resources", icon: Package },
  { id: 4, label: "Review & Submit", icon: ClipboardCheck },
];

/* ── RPC return types ─────────────────────────────────────── */
interface AvailableVenue {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  description: string | null;
}

interface ResourceAvailability {
  id: string;
  name: string;
  description: string | null;
  condition: string;
  total_quantity: number;
  allocated: number;
  available: number;
  qty: number; // local UI state
}

interface EventDetails {
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
}

/* ── Props ────────────────────────────────────────────────── */
interface BookingWizardProps {
  mode?: "create" | "edit";
  initialBooking?: EditableBooking;
}

export default function BookingWizard({
  mode = "create",
  initialBooking,
}: BookingWizardProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = mode === "edit";

  /* ── Pre-fill from existing booking in edit mode ─────────── */
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [details, setDetails] = useState<EventDetails>({
    title: initialBooking?.title ?? "",
    description: initialBooking?.description ?? "",
    date: initialBooking?.start_time
      ? formatDateTime(initialBooking.start_time)
      : "",
    start_time: initialBooking?.start_time
      ? formatTime(initialBooking.start_time)
      : "",
    end_time: initialBooking?.end_time
      ? formatTime(initialBooking.end_time)
      : "",
  });

  /* Pre-fill venue from existing booking safely using Array.isArray */
  const rawVenue = Array.isArray(initialBooking?.venues)
    ? initialBooking.venues[0]
    : initialBooking?.venues;

  const existingVenue = rawVenue
    ? {
        id: rawVenue.id,
        name: rawVenue.name,
        location: rawVenue.location,
        capacity: rawVenue.capacity,
        description: rawVenue.description,
      }
    : null;

  const [venues, setVenues] = useState<AvailableVenue[]>([]);
  const [venue, setVenue] = useState<AvailableVenue | null>(existingVenue);
  const [resources, setResources] = useState<ResourceAvailability[]>([]);

  /* ── Step 1 → 2: fetch available venues ─────────────────── */
  async function goToVenueStep() {
    setError("");
    if (
      !details.title ||
      !details.date ||
      !details.start_time ||
      !details.end_time
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    const start = new Date(`${details.date}T${details.start_time}`);
    const end = new Date(`${details.date}T${details.end_time}`);

    if (end <= start) {
      setError("End time must be after start time.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: err } = await supabase.rpc("get_available_venues", {
        p_start: start.toISOString(),
        p_end: end.toISOString(),
        /* Exclude current booking from conflict checks */
        p_exclude_event_id: isEdit ? initialBooking!.id : null,
      });

      if (err) throw err;

      setVenues((data as AvailableVenue[]) ?? []);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch venues");
    } finally {
      setLoading(false);
    }
  }

  /* ── Step 2 → 3: fetch resource availability ────────────── */
  async function goToResourceStep() {
    if (!venue) return setError("Please select a venue.");

    setError("");
    setLoading(true);

    const start = new Date(`${details.date}T${details.start_time}`);
    const end = new Date(`${details.date}T${details.end_time}`);

    try {
      const { data, error: err } = await supabase.rpc(
        "get_resources_availability",
        {
          p_start: start.toISOString(),
          p_end: end.toISOString(),
          p_exclude_event_id: isEdit ? initialBooking!.id : null,
        },
      );

      if (err) throw err;

      /* In edit mode — pre-fill quantities from existing event_resources */
      const existing = initialBooking?.event_resources ?? [];

      setResources(
        ((data as Omit<ResourceAvailability, "qty">[]) ?? []).map((r) => {
          const prev = existing.find((e) => e.resource_id === r.id);
          return {
            ...r,
            /* Add back the previously allocated qty so "available"
               shows correctly (RPC already excluded this booking) */
            qty: prev?.quantity_requested ?? 0,
          };
        }),
      );
      setStep(3);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch resources",
      );
    } finally {
      setLoading(false);
    }
  }

  /* ── Submit (create or update) ──────────────────────────── */
  async function submit() {
    setError("");
    setLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user)
        throw new Error("You must be logged in to book an event.");

      const start = new Date(`${details.date}T${details.start_time}`);
      const end = new Date(`${details.date}T${details.end_time}`);

      if (isEdit && initialBooking) {
        /* ── UPDATE existing booking ── */
        const { error: evErr } = await supabase
          .from("events")
          .update({
            title: details.title,
            description: details.description || null,
            venue_id: venue!.id,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            /* Reset status to pending so HOD reviews the changes */
            status: "pending",
            approved_by: null,
            approved_at: null,
            rejection_reason: null,
          })
          .eq("id", initialBooking.id);

        if (evErr) throw evErr;

        /* Delete old resources and re-insert updated ones */
        const { error: delErr } = await supabase
          .from("event_resources")
          .delete()
          .eq("event_id", initialBooking.id);

        if (delErr) throw delErr;

        const toInsert = resources
          .filter((r) => r.qty > 0)
          .map((r) => ({
            event_id: initialBooking.id,
            resource_id: r.id,
            quantity_requested: r.qty,
          }));

        if (toInsert.length > 0) {
          const { error: resErr } = await supabase
            .from("event_resources")
            .insert(toInsert);
          if (resErr) throw resErr;
        }
      } else {
        /* ── INSERT new booking ── */
        const { data: event, error: evErr } = await supabase
          .from("events")
          .insert({
            title: details.title,
            description: details.description || null,
            user_id: user.id,
            venue_id: venue!.id,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            status: "pending",
          })
          .select()
          .single();

        if (evErr) throw evErr;

        const toInsert = resources
          .filter((r) => r.qty > 0)
          .map((r) => ({
            event_id: event.id,
            resource_id: r.id,
            quantity_requested: r.qty,
          }));

        if (toInsert.length > 0) {
          const { error: resErr } = await supabase
            .from("event_resources")
            .insert(toInsert);
          if (resErr) throw resErr;
        }
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Success screen ───────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="card p-6 sm:p-12 text-center max-w-md mx-auto animate-fade-in w-full">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          {isEdit ? "Booking Updated!" : "Booking Submitted!"}
        </h2>
        <p className="text-slate-500 text-sm mb-8 px-2 sm:px-0">
          {isEdit
            ? "Your booking has been updated and is pending approval again."
            : "Your request is now pending approval from an HOD or Event Coordinator."}
        </p>
        <button
          onClick={() => router.push("/bookings")}
          className="w-full sm:w-auto px-6 py-3.5 sm:py-3 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "#0D1A38" }}
        >
          View My Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* Edit mode notice */}
      {isEdit && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-800 animate-fade-in w-full">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
          <div className="wrap-break-word">
            <span className="font-semibold">Editing a pending booking.</span>{" "}
            Saving changes will reset its status back to{" "}
            <span className="font-semibold">Pending</span> so it can be reviewed
            again by the approving authority.
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="card p-4 sm:p-6 mb-6 w-full">
        <div className="flex items-center justify-between relative px-2 sm:px-0">
          <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-200 z-0" />
          <div
            className="absolute left-0 top-4 h-0.5 bg-amber-500 transition-all duration-500 z-0"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
          {STEPS.map((s) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2 z-10">
                <div
                  className={`step-dot ${active ? "active" : done ? "done" : "upcoming"}`}
                >
                  {done ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <span>{s.id}</span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide hidden sm:block ${
                    active
                      ? "text-amber-600"
                      : done
                        ? "text-slate-600"
                        : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm animate-fade-in w-full">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="wrap-break-word">{error}</span>
        </div>
      )}

      <div className="card p-4 sm:p-7 animate-fade-in w-full">
        {step === 1 && (
          <Step1
            details={details}
            setDetails={setDetails}
            onNext={goToVenueStep}
            loading={loading}
          />
        )}
        {step === 2 && (
          <Step2
            venues={venues}
            selected={venue}
            setSelected={setVenue}
            onBack={() => setStep(1)}
            onNext={goToResourceStep}
            loading={loading}
          />
        )}
        {step === 3 && (
          <Step3
            resources={resources}
            setResources={setResources}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <Step4
            details={details}
            venue={venue!}
            resources={resources.filter((r) => r.qty > 0)}
            onBack={() => setStep(3)}
            onSubmit={submit}
            loading={loading}
            isEdit={isEdit}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP COMPONENTS
═══════════════════════════════════════════════════════════════ */

/* ── Step 1: Event Details ───────────────────────────────── */
function Step1({
  details,
  setDetails,
  onNext,
  loading,
}: {
  details: EventDetails;
  setDetails: React.Dispatch<React.SetStateAction<EventDetails>>;
  onNext: () => void;
  loading: boolean;
}) {
  const set = (k: keyof EventDetails, v: string) =>
    setDetails((p) => ({ ...p, [k]: v }));
  const today = formatDate(new Date());

  return (
    <div className="w-full">
      <SectionHeader
        icon={<CalendarDays className="w-5 h-5" />}
        title="Event Details"
        subtitle="Describe your event and set the schedule."
      />
      <div className="space-y-4 mt-6">
        <FormField label="Event Title *">
          <input
            className="field-input w-full p-3 sm:p-2.5 border rounded-xl text-sm sm:text-base"
            value={details.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Annual Tech Symposium"
          />
        </FormField>
        <FormField label="Description">
          <textarea
            className="field-input min-h-25 sm:min-h-20 resize-none w-full p-3 sm:p-2.5 border rounded-xl text-sm sm:text-base"
            value={details.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Brief description of the event..."
            rows={3}
          />
        </FormField>
        <FormField label="Date *">
          <input
            className="field-input w-full p-3 sm:p-2.5 border rounded-xl text-sm sm:text-base"
            type="date"
            min={today}
            value={details.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Start Time *">
            <input
              className="field-input w-full p-3 sm:p-2.5 border rounded-xl text-sm sm:text-base"
              type="time"
              value={details.start_time}
              onChange={(e) => set("start_time", e.target.value)}
            />
          </FormField>
          <FormField label="End Time *">
            <input
              className="field-input w-full p-3 sm:p-2.5 border rounded-xl text-sm sm:text-base"
              type="time"
              value={details.end_time}
              onChange={(e) => set("end_time", e.target.value)}
            />
          </FormField>
        </div>
      </div>
      <NavButtons
        onNext={onNext}
        loading={loading}
        nextLabel="Check Availability"
      />
    </div>
  );
}

/* ── Step 2: Venue Selection ─────────────────────────────── */
function Step2({
  venues,
  selected,
  setSelected,
  onBack,
  onNext,
  loading,
}: {
  venues: AvailableVenue[];
  selected: AvailableVenue | null;
  setSelected: (v: AvailableVenue) => void;
  onBack: () => void;
  onNext: () => void;
  loading: boolean;
}) {
  return (
    <div className="w-full">
      <SectionHeader
        icon={<MapPin className="w-5 h-5" />}
        title="Select Venue"
        subtitle={
          venues.length === 0
            ? "No venues available for this time slot."
            : `${venues.length} venue${venues.length > 1 ? "s" : ""} available.`
        }
      />
      {venues.length === 0 ? (
        <div className="mt-6 text-center py-10 bg-slate-50 rounded-xl border border-slate-200 px-4">
          <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            All venues are booked for this slot. Please go back and choose a
            different time.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {venues.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelected(v)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all active:scale-[0.99] ${
                selected?.id === v.id
                  ? "border-amber-500 bg-amber-50"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate text-sm sm:text-base">
                    {v.name}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                    {v.location}
                  </div>
                  {v.description && (
                    <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {v.description}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                    <Users className="w-3 h-3 shrink-0" /> {v.capacity}
                  </div>
                  {selected?.id === v.id && (
                    <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center mt-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      <NavButtons
        onBack={onBack}
        onNext={onNext}
        loading={loading}
        nextDisabled={!selected}
        nextLabel="Select Resources"
      />
    </div>
  );
}

/* ── Step 3: Resources ───────────────────────────────────── */
function Step3({
  resources,
  setResources,
  onBack,
  onNext,
}: {
  resources: ResourceAvailability[];
  setResources: React.Dispatch<React.SetStateAction<ResourceAvailability[]>>;
  onBack: () => void;
  onNext: () => void;
}) {
  const setQty = (id: string, qty: number) =>
    setResources((r) => r.map((x) => (x.id === id ? { ...x, qty } : x)));

  return (
    <div className="w-full">
      <SectionHeader
        icon={<Package className="w-5 h-5" />}
        title="Resource Allocation"
        subtitle="Select equipment needed. Quantities are capped at current availability."
      />
      <div className="mt-6 space-y-2">
        {resources.map((r) => (
          <div
            key={r.id}
            className={`flex items-center justify-between gap-2 sm:gap-4 p-3 sm:p-3.5 rounded-xl border transition-colors ${
              r.qty > 0
                ? "border-amber-200 bg-amber-50/50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">
                {r.name}
              </div>
              <div className="text-xs text-slate-500 truncate mt-0.5">
                <span
                  className={
                    r.available > 0
                      ? "text-emerald-600 font-medium"
                      : "text-red-500 font-medium"
                  }
                >
                  {r.available} available
                </span>
                <span className="text-slate-400">
                  {" "}
                  / {r.total_quantity} total
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => setQty(r.id, Math.max(0, r.qty - 1))}
                disabled={r.qty === 0}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 text-lg font-medium shrink-0 active:scale-[0.95] transition-transform"
              >
                −
              </button>
              <input
                type="number"
                min={0}
                max={r.available}
                value={r.qty}
                onChange={(e) =>
                  setQty(
                    r.id,
                    Math.min(r.available, Math.max(0, Number(e.target.value))),
                  )
                }
                className="w-12 sm:w-14 text-center text-sm font-semibold border border-slate-300 rounded-lg py-1.5 outline-none focus:border-amber-500"
              />
              <button
                onClick={() => setQty(r.id, Math.min(r.available, r.qty + 1))}
                disabled={r.qty >= r.available || r.available === 0}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 text-lg font-medium shrink-0 active:scale-[0.95] transition-transform"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-start sm:items-center gap-2.5 text-xs text-slate-500 bg-slate-50 rounded-lg px-4 py-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0 text-slate-400" />
        Resources are optional. Leave all at 0 to proceed without equipment.
      </div>
      <NavButtons
        onBack={onBack}
        onNext={onNext}
        loading={false}
        nextLabel="Review Booking"
      />
    </div>
  );
}

/* ── Step 4: Review & Submit ─────────────────────────────── */
function Step4({
  details,
  venue,
  resources,
  onBack,
  onSubmit,
  loading,
  isEdit,
}: {
  details: EventDetails;
  venue: AvailableVenue;
  resources: ResourceAvailability[];
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  isEdit: boolean;
}) {
  return (
    <div className="w-full">
      <SectionHeader
        icon={<ClipboardCheck className="w-5 h-5" />}
        title="Review & Submit"
        subtitle="Confirm your details before submitting."
      />
      <div className="mt-6 space-y-4">
        <ReviewSection title="Event Information">
          <Row label="Title" value={details.title} />
          <Row label="Description" value={details.description || "—"} />
          <Row label="Date" value={details.date} />
          <Row label="Start Time" value={details.start_time} />
          <Row label="End Time" value={details.end_time} />
        </ReviewSection>
        <ReviewSection title="Venue">
          <Row label="Name" value={venue.name} />
          <Row label="Location" value={venue.location ?? "—"} />
          <Row label="Capacity" value={`${venue.capacity} persons`} />
        </ReviewSection>
        <ReviewSection title={`Resources (${resources.length})`}>
          {resources.length === 0 ? (
            <p className="text-sm text-slate-400">No resources requested.</p>
          ) : (
            resources.map((r) => (
              <Row key={r.id} label={r.name} value={`× ${r.qty}`} />
            ))
          )}
        </ReviewSection>
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-amber-800 leading-relaxed wrap-break-word">
        {isEdit
          ? "Saving will reset this booking to Pending and it will need to be approved again."
          : "Your request will be submitted as Pending and requires HOD/Coordinator approval."}
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onSubmit}
        loading={loading}
        nextLabel={isEdit ? "Save Changes" : "Submit Request"}
        nextClass={
          isEdit
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-emerald-600 hover:bg-emerald-700 text-white"
        }
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
═══════════════════════════════════════════════════════════════ */
function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 w-full">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-amber-400 shrink-0"
        style={{ background: "#0D1A38" }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="font-display font-bold text-slate-900 text-lg sm:text-xl wrap-break-word">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 wrap-break-word mt-0.5">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  loading = false,
  nextLabel = "Next",
  nextDisabled = false,
  nextClass,
}: {
  onBack?: () => void;
  onNext: () => void;
  loading?: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextClass?: string;
}) {
  return (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between mt-8 pt-6 border-t border-slate-100 gap-4 sm:gap-0">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center justify-center sm:justify-start gap-1.5 py-3 sm:py-2.5 px-4 sm:px-2 sm:-ml-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 sm:bg-transparent rounded-xl sm:rounded-none transition-all active:scale-[0.98] sm:active:scale-100"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" /> Back
        </button>
      ) : (
        <div className="hidden sm:block" />
      )}
      <button
        onClick={onNext}
        disabled={loading || nextDisabled}
        className={`flex items-center justify-center gap-2 px-5 py-3.5 sm:py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98] ${
          nextClass ?? "text-white"
        }`}
        style={!nextClass ? { background: "#0D1A38" } : undefined}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : null}
        {nextLabel}
        {!loading && <ChevronRight className="w-4 h-4 shrink-0" />}
      </button>
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden w-full">
      <div className="px-4 py-3 sm:py-2.5 bg-slate-50 border-b border-slate-200">
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          {title}
        </h4>
      </div>
      <div className="px-4 py-4 sm:py-3 space-y-3 sm:space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 text-sm border-b border-slate-100/50 sm:border-transparent pb-2 sm:pb-0 last:border-0 last:pb-0">
      <span className="text-slate-500 shrink-0 font-medium sm:font-normal">
        {label}
      </span>
      <span className="text-slate-900 font-medium text-left sm:text-right wrap-break-word w-full sm:w-auto">
        {value}
      </span>
    </div>
  );
}
