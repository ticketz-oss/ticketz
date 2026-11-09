import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { AppUpdate } from "./appUpdatePlugin";
import type { DownloadProgress } from "./appUpdatePlugin";
import { APP_VERSION, APP_BUILD_NUMBER, APP_DOWNLOAD_URL } from "../config/appConfig";

export const CURRENT_APP_VERSION = APP_VERSION;
export const CURRENT_BUILD_NUMBER = APP_BUILD_NUMBER;

export interface VersionInfo {
  version: string;
  versionCode: number;
  apkUrl: string;
  releaseDate?: string;
  mandatory?: boolean;
  notes: string[];
}

export interface CheckUpdateResult {
  hasUpdate: boolean;
  currentVersion: string;
  currentBuild: number;
  remoteInfo?: VersionInfo;
}

export async function getCurrentAppInfo(): Promise<{ version: string; build: number; isNative: boolean }> {
  const isNative = Capacitor.isNativePlatform();
  if (isNative) {
    try {
      const info = await App.getInfo();
      return {
        version: info.version || CURRENT_APP_VERSION,
        build: parseInt(info.build, 10) || CURRENT_BUILD_NUMBER,
        isNative: true,
      };
    } catch (e) {
      console.warn("Could not fetch native App.getInfo(), fallback to constant", e);
    }
  }

  return {
    version: CURRENT_APP_VERSION,
    build: CURRENT_BUILD_NUMBER,
    isNative: false,
  };
}

export async function checkForUpdate(): Promise<CheckUpdateResult> {
  const { version: currentVersion, build: currentBuild, isNative } = await getCurrentAppInfo();

  try {
    const host =
      typeof window !== "undefined" && window.location.origin.startsWith("http")
        ? window.location.origin
        : "";
    const url = host ? `${host}/version.json?_t=${Date.now()}` : `/version.json?_t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data: VersionInfo = await res.json();
    if (!data || !data.versionCode) {
      return { hasUpdate: false, currentVersion, currentBuild };
    }
    data.apkUrl = data.apkUrl || APP_DOWNLOAD_URL;

    // If native, compare versionCode. If remote versionCode > local build number, update!
    // Or if version strings differ and remote is newer
    const hasUpdate = isNative
      ? data.versionCode > currentBuild
      : data.version !== currentVersion;

    return {
      hasUpdate,
      currentVersion,
      currentBuild,
      remoteInfo: data,
    };
  } catch (err) {
    console.warn("Error checking for app update:", err);
    return { hasUpdate: false, currentVersion, currentBuild };
  }
}

export async function checkCanInstallPackages(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const res = await AppUpdate.canRequestPackageInstalls();
    return res.value;
  } catch (e) {
    console.warn("Error checking canRequestPackageInstalls:", e);
    return true;
  }
}

export async function openInstallSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await AppUpdate.openInstallPermissionSettings();
  } catch (e) {
    console.warn("Error opening install permission settings:", e);
  }
}

export async function startAppUpdate(
  apkUrl: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<{ success: boolean; error?: string }> {
  if (!Capacitor.isNativePlatform()) {
    // If running in web browser, open the download link
    window.location.href = apkUrl;
    return { success: true };
  }

  try {
    let removeListener: (() => void) | null = null;
    if (onProgress) {
      const handle = await AppUpdate.addListener("downloadProgress", onProgress);
      removeListener = () => handle.remove();
    }

    const res = await AppUpdate.downloadAndInstall({ url: apkUrl });

    if (removeListener) {
      removeListener();
    }

    return { success: res.success };
  } catch (err: any) {
    console.error("Failed to execute app update:", err);
    return { success: false, error: err?.message || String(err) };
  }
}
