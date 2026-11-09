// Canonical single source of truth for App Version and Download URLs
export const APP_VERSION = "2.5.1";
export const APP_BUILD_NUMBER = 251;

/**
 * The single canonical APK download URL used by all screens, modals, and landing pages.
 * /download is explicitly routed in Nginx with no-store/no-cache headers,
 * ensuring Cloudflare and mobile browsers ALWAYS fetch the latest APK build directly.
 */
export const APP_DOWNLOAD_URL =
  typeof window !== "undefined" && window.location.origin.startsWith("http")
    ? `${window.location.origin}/download`
    : "/download";
