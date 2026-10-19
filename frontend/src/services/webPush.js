import api from "./api";

const pushSupported = () =>
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

const toUint8Array = value => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(character => character.charCodeAt(0)));
};

const registration = () =>
  navigator.serviceWorker.register("/push-sw.js", { scope: "/" });

export const webPushSupported = pushSupported;

export const webPushState = async () => {
  if (!pushSupported()) return { supported: false, active: false };
  const currentRegistration = await registration();
  const subscription = await currentRegistration.pushManager.getSubscription();
  return {
    supported: true,
    active: Boolean(subscription),
    permission: Notification.permission
  };
};

export const enableWebPush = async () => {
  if (!pushSupported()) throw new Error("WEB_PUSH_UNSUPPORTED");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("WEB_PUSH_PERMISSION_DENIED");

  const [{ data }, currentRegistration] = await Promise.all([
    api.get("/push/public-key"),
    registration()
  ]);
  if (!data.available || !data.publicKey) {
    throw new Error("WEB_PUSH_UNAVAILABLE");
  }

  let subscription = await currentRegistration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await currentRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toUint8Array(data.publicKey)
    });
  }

  await api.post("/push/subscriptions", subscription.toJSON());
  return subscription;
};

export const disableWebPush = async () => {
  if (!pushSupported()) return;
  const currentRegistration = await registration();
  const subscription = await currentRegistration.pushManager.getSubscription();
  if (!subscription) return;
  await api.delete("/push/subscriptions", {
    data: { endpoint: subscription.endpoint }
  });
  await subscription.unsubscribe();
};

export const testWebPush = () => api.post("/push/test");
