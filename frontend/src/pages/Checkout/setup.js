export const TRIAL_DAYS = 7;
// Same list as backend helpers/normalizeSlug.ts: these addresses collide with
// infrastructure hostnames and are refused by the signup API.
const RESERVED_SLUGS = new Set([
  "www",
  "api",
  "app",
  "admin",
  "backend",
  "frontend",
  "static",
  "assets",
  "public"
]);
export const isReservedSlug = slug => RESERVED_SLUGS.has(slug);

export const slugFromName = name =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63)
    .replace(/-$/, "");

export const firstBillingPreview = (dueDay, now = new Date()) => {
  const end = new Date(now.getTime() + TRIAL_DAYS * 86400000);
  const year = end.getUTCFullYear();
  const month = end.getUTCMonth();
  const dateInMonth = (y, m) =>
    new Date(
      Date.UTC(
        y,
        m,
        Math.min(Number(dueDay), new Date(Date.UTC(y, m + 1, 0)).getUTCDate())
      )
    );
  let due = dateInMonth(year, month);
  if (due <= new Date(Date.UTC(year, month, end.getUTCDate())))
    due = dateInMonth(year, month + 1);
  return due;
};

// Last trial day: the first (prorated) invoice is due on it.
export const trialEndPreview = (now = new Date()) => {
  const end = new Date(now.getTime() + TRIAL_DAYS * 86400000);
  return new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  );
};

// Same rule as backend ProrataService: each month's days are priced by that
// month's length, in integer cents, with a single half-up rounding.
const PRORATA_SCALE = 377580;
export const prorataCents = (monthlyCents, start, end) => {
  const sameDayNextMonth = new Date(start);
  sameDayNextMonth.setUTCMonth(sameDayNextMonth.getUTCMonth() + 1);
  if (sameDayNextMonth.getTime() === end.getTime()) return monthlyCents;
  let scaled = 0;
  let cursor = new Date(start);
  while (cursor < end) {
    const nextMonth = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1)
    );
    const segmentEnd = nextMonth < end ? nextMonth : end;
    const days = Math.round((segmentEnd - cursor) / 86400000);
    const daysInMonth = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0)
    ).getUTCDate();
    scaled += monthlyCents * days * (PRORATA_SCALE / daysInMonth);
    cursor = segmentEnd;
  }
  return Math.floor((scaled + PRORATA_SCALE / 2) / PRORATA_SCALE);
};

export const tenantLoginUrl = (slug, location, baseDomain) => {
  if (!slug) return "/login";
  const domain =
    baseDomain ||
    (location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname.endsWith(".localhost")
      ? "localhost"
      : location.hostname);
  return `${location.protocol}//${slug}.${domain}${location.port ? `:${location.port}` : ""}/login`;
};
