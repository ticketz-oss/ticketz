import { registerPlugin, Capacitor } from "@capacitor/core";

export interface NativeNotificationInterface {
  showNotification(options: {
    title: string;
    body: string;
    ticketId: number;
  }): Promise<{ success: boolean }>;
}

export const NativeNotification = registerPlugin<NativeNotificationInterface>("NativeNotification");

export async function showNativeStatusNotification(title: string, body: string, ticketId: number) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await NativeNotification.showNotification({ title, body, ticketId });
  } catch (err) {
    console.warn("Failed to show native Android notification:", err);
  }
}
