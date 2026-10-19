import { getBackendURL } from "../services/config";

// Chat uploads belong to the active backend. Older records contain the base
// deployment host, which can route to a different tenant's public directory.
export default function chatMediaUrl(value) {
  if (!value || /^(blob:|data:)/i.test(value)) return value;
  const match = value.match(
    /^(?:https?:\/\/[^/]+)?(?:\/backend)?\/public\/(.+)$/i
  );
  if (!match) return value;
  return `${getBackendURL().replace(/\/$/, "")}/public/${match[1]}`;
}
