// utils/format.ts
import { format, parseISO, isValid } from "date-fns";

export function formatDateTime(dt: string | Date | null | undefined): string {
  if (!dt) return "—";
  const d = typeof dt === "string" ? parseISO(dt) : dt;
  return isValid(d) ? format(d, "dd MMM yyyy, HH:mm") : "—";
}

export function formatDate(dt: string | Date | null | undefined): string {
  if (!dt) return "—";
  const d = typeof dt === "string" ? parseISO(dt) : dt;
  return isValid(d) ? format(d, "dd MMM yyyy") : "—";
}