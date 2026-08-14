import { describe, expect, it } from "vitest";
import {
  dayKeyOf,
  fromDateTimeLocalValue,
  isOverdue,
  toDateTimeLocalValue,
  toLocalDayKey,
} from "@/lib/format";

describe("deadline conversion", () => {
  it("round-trips a local wall-clock time through the datetime-local input", () => {
    // The user picks 14:30 local; that must come back as 14:30 local after a
    // trip through the UTC ISO string the API stores.
    const picked = "2026-08-20T14:30";
    const iso = fromDateTimeLocalValue(picked);
    expect(iso).not.toBeNull();
    expect(toDateTimeLocalValue(iso)).toBe(picked);
  });

  it("stores the picked time as a real UTC instant, not a locale-formatted string", () => {
    const iso = fromDateTimeLocalValue("2026-08-20T14:30");
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    // The instant must correspond to 14:30 in the runtime's local zone.
    const parsed = new Date(iso as string);
    expect(parsed.getHours()).toBe(14);
    expect(parsed.getMinutes()).toBe(30);
  });

  it("treats an empty or malformed input as no deadline rather than an invalid date", () => {
    expect(fromDateTimeLocalValue("")).toBeNull();
    expect(fromDateTimeLocalValue("not-a-date")).toBeNull();
    expect(toDateTimeLocalValue(null)).toBe("");
  });

  it("pads single-digit months, days, hours and minutes", () => {
    const iso = new Date(2026, 0, 5, 9, 7).toISOString();
    expect(toDateTimeLocalValue(iso)).toBe("2026-01-05T09:07");
  });
});

describe("overdue detection", () => {
  it("flags a past deadline and clears a future one", () => {
    expect(isOverdue(new Date(Date.now() - 60_000).toISOString())).toBe(true);
    expect(isOverdue(new Date(Date.now() + 60_000).toISOString())).toBe(false);
  });

  it("never marks a task with no deadline as overdue", () => {
    expect(isOverdue(null)).toBe(false);
  });
});

describe("calendar day bucketing", () => {
  it("buckets a deadline into the same local day the calendar grid renders", () => {
    // The calendar keys its cells with dayKeyOf(Date) and its tasks with
    // toLocalDayKey(iso); if these ever disagree, tasks land on the wrong cell.
    const localDay = new Date(2026, 7, 20, 23, 45);
    expect(toLocalDayKey(localDay.toISOString())).toBe(dayKeyOf(localDay));
  });

  it("keeps a late-evening deadline on its own local day rather than sliding into UTC's", () => {
    const lateEvening = new Date(2026, 7, 20, 23, 59);
    expect(toLocalDayKey(lateEvening.toISOString())).toBe("2026-08-20");
  });

  it("keeps an early-morning deadline on its own local day", () => {
    const earlyMorning = new Date(2026, 7, 20, 0, 15);
    expect(toLocalDayKey(earlyMorning.toISOString())).toBe("2026-08-20");
  });

  it("produces a zero-padded yyyy-MM-dd key", () => {
    expect(dayKeyOf(new Date(2026, 0, 3))).toBe("2026-01-03");
  });
});
