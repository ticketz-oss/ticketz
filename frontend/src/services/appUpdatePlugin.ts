import { registerPlugin } from "@capacitor/core";

export interface DownloadProgress {
  percent: number;
  bytesDownloaded: number;
  totalBytes: number;
}

export interface AppUpdatePluginInterface {
  canRequestPackageInstalls(): Promise<{ value: boolean }>;
  openInstallPermissionSettings(): Promise<void>;
  downloadAndInstall(options: { url: string }): Promise<{ success: boolean }>;
  addListener(
    eventName: "downloadProgress",
    listenerFunc: (progress: DownloadProgress) => void
  ): Promise<any>;
}

export const AppUpdate = registerPlugin<AppUpdatePluginInterface>("AppUpdate");
