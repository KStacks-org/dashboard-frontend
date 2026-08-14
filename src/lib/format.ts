import { currentLocale } from "@/lib/i18n";

/**
 * Deadlines are stored as UTC timestamptz and rendered in the viewer's local
 * timezone. Arabic UI keeps Western digits (`latn`), matching KSA university
 * software convention.
 */
function intlLocale(): string {
  return currentLocale() === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB";
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(intlLocale(), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(intlLocale(), { dateStyle: "medium" }).format(new Date(iso));
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat(intlLocale(), {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

/** Converts an ISO timestamp to the `yyyy-MM-ddTHH:mm` shape a datetime-local input expects. */
export function toDateTimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Interprets a `datetime-local` value as local time and returns a UTC ISO string. */
export function fromDateTimeLocalValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Local calendar day key (`yyyy-MM-dd`) — used to bucket tasks into calendar cells. */
export function toLocalDayKey(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dayKeyOf(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
