import { i18n } from "../../translate/i18n";

export const STORY_BLUE = "#024BF4";
export const STORY_SEEN = "#C4C4CC";
export const MEDIA_BACKGROUND = "#18181B";
export const TEXT_LIMIT = 700;

export const STORY_COLORS = [
  { key: "blue", hex: "#024BF4" },
  { key: "green", hex: "#15803D" },
  { key: "purple", hex: "#6D28D9" },
  { key: "orange", hex: "#C2410C" },
  { key: "pink", hex: "#BE185D" },
  { key: "graphite", hex: "#27272A" }
];

// Translation without HTML escaping: React already escapes text nodes, and
// names such as "Pão & Cia" must not show up as "Pão &amp; Cia".
export const t = (key, values = {}) =>
  i18n.t(key, { ...values, interpolation: { escapeValue: false } });

const toTime = value => {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

// Labels follow the evidence the provider gives: "published" only means the
// session accepted the message, so it is shown as "sent to session".
export const storyStateLabel = (post, now = Date.now()) => {
  switch (post?.state) {
    case "queued": {
      const scheduledAt = toTime(post.scheduledAt);
      return scheduledAt && scheduledAt > now
        ? "whatsappStatus.state.scheduled"
        : "whatsappStatus.state.sending";
    }
    case "publishing":
      return "whatsappStatus.state.sending";
    case "published":
      return "whatsappStatus.state.sent";
    case "failed":
      return "whatsappStatus.state.failed";
    case "unsupported":
      return "whatsappStatus.state.unsupported";
    case "cancelled":
      return "whatsappStatus.state.cancelled";
    default:
      return "whatsappStatus.state.draft";
  }
};

export const failureMessage = code => {
  if (!code) return "";
  const key = `whatsappStatus.errors.${code}`;
  return i18n.exists(key) ? t(key) : code;
};

// Same math as the design: n equal arcs, with a 2.5% separator in the
// surface color when there is more than one story.
export const ringGradient = (count, seen, separator) => {
  const color = seen ? STORY_SEEN : STORY_BLUE;
  const total = Math.max(1, count);
  const gap = total > 1 ? 2.5 : 0;
  const parts = [];
  for (let index = 0; index < total; index += 1) {
    const start = (100 / total) * index;
    const end = (100 / total) * (index + 1) - gap;
    parts.push(`${color} ${start}% ${end}%`);
    if (gap) parts.push(`${separator} ${end}% ${(100 / total) * (index + 1)}%`);
  }
  return `conic-gradient(${parts.join(",")})`;
};

export const initialsOf = name => {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

export const formatPhone = number => {
  const digits = String(number || "").replace(/\D/g, "");
  if (!digits) return "";
  if (
    digits.startsWith("55") &&
    (digits.length === 12 || digits.length === 13)
  ) {
    const area = digits.slice(2, 4);
    const local = digits.slice(4);
    const split = local.length - 4;
    return `+55 (${area}) ${local.slice(0, split)}-${local.slice(split)}`;
  }
  return `+${digits}`;
};

const seenKey = userId => `ew-status-seen-${userId}`;

export const loadSeen = userId => {
  try {
    const raw = window.localStorage.getItem(seenKey(userId));
    const ids = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch (_) {
    return new Set();
  }
};

export const markSeen = (userId, ids) => {
  const seen = loadSeen(userId);
  ids.forEach(id => seen.add(id));
  try {
    // Keep the list short: stories only live for a day.
    const list = Array.from(seen).slice(-500);
    window.localStorage.setItem(seenKey(userId), JSON.stringify(list));
  } catch (_) {
    // Seen markers are a convenience; a blocked storage only resets colors.
  }
  return seen;
};

// Drafts stay in the strip so they can be edited or downloaded later (a
// Cloud API connection can only save drafts); the server only lists recent ones.
const isVisible = (post, now) => {
  if (!post || post.state === "cancelled") return false;
  const expiresAt = toTime(post.expiresAt);
  return !(expiresAt && expiresAt <= now);
};

export const groupPostsByConnection = (posts, now = Date.now()) => {
  const grouped = {};
  (posts || [])
    .filter(post => isVisible(post, now))
    .sort((a, b) => (toTime(a.createdAt) || 0) - (toTime(b.createdAt) || 0))
    .forEach(post => {
      if (!grouped[post.whatsappId]) grouped[post.whatsappId] = [];
      grouped[post.whatsappId].push(post);
    });
  return grouped;
};

// Socket payloads may omit the author; keep the one already on screen.
export const upsertPost = (posts, post) => {
  const list = posts || [];
  const previous = list.find(item => item.id === post.id);
  // A publish response can arrive after the socket already reported a newer
  // state; keep whichever version the server updated last.
  if (
    previous &&
    toTime(previous.updatedAt) &&
    toTime(post.updatedAt) &&
    toTime(post.updatedAt) < toTime(previous.updatedAt)
  ) {
    return list;
  }
  const others = list.filter(item => item.id !== post.id);
  const next =
    previous && post.createdBy == null && previous.createdBy != null
      ? { ...post, createdBy: previous.createdBy }
      : post;
  return [...others, next];
};

const pad = value => String(value).padStart(2, "0");

const clock = date => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const formatAgo = (value, now = Date.now()) => {
  const time = toTime(value);
  if (!time) return t("whatsappStatus.time.none");
  const minutes = Math.floor((now - time) / 60000);
  if (minutes < 1) return t("whatsappStatus.time.now");
  if (minutes < 60) return t("whatsappStatus.time.minutesAgo", { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("whatsappStatus.time.hoursAgo", { n: hours });
  return t("whatsappStatus.time.daysAgo", { n: Math.floor(hours / 24) });
};

export const formatPostedAt = (value, now = Date.now()) => {
  const time = toTime(value);
  if (!time) return t("whatsappStatus.time.none");
  const date = new Date(time);
  const today = new Date(now);
  const yesterday = new Date(now - 86400000);
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(date, today))
    return t("whatsappStatus.time.today", { time: clock(date) });
  if (sameDay(date, yesterday))
    return t("whatsappStatus.time.yesterday", { time: clock(date) });
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}, ${clock(date)}`;
};

export const formatExpiresIn = (value, now = Date.now()) => {
  const time = toTime(value);
  if (!time || time <= now) return t("whatsappStatus.time.none");
  const minutes = Math.round((time - now) / 60000);
  if (minutes < 60) return t("whatsappStatus.time.minutes", { n: minutes });
  return t("whatsappStatus.time.hours", { n: Math.round(minutes / 60) });
};
