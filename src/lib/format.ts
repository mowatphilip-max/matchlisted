const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const gbpPence = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
});

export function formatPrice(value: number): string {
  return gbp.format(value);
}

export function formatMoney(value: number): string {
  return Number.isInteger(value) ? gbp.format(value) : gbpPence.format(value);
}

/**
 * A seeker's budget line. Sheet-sourced seekers who keep their budget
 * private arrive as 0/0 — never render that as "£0 – £0" (the bug fixed in
 * BUILD-BRIEF.md Phase 1); use the site's established undisclosed wording.
 */
export function formatBudget(min: number, max: number): string {
  if (max <= 0) return "Substantial budget · undisclosed";
  if (min <= 0 || min === max) return `Up to ${gbp.format(max)}`;
  return `${gbp.format(min)} – ${gbp.format(max)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimeRange(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };
  const start = new Date(startIso);
  const end = new Date(endIso);
  return `${start.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })}, ${start.toLocaleTimeString("en-GB", opts)}–${end.toLocaleTimeString(
    "en-GB",
    opts,
  )}`;
}
