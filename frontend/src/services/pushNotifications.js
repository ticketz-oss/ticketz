import api from "./api";

const SERVICE_WORKER_PATH = "/service-worker.js";

// A chave VAPID trafega em base64url; o PushManager exige Uint8Array.
const urlBase64ToUint8Array = base64String => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const sameKey = (subscriptionKey, expectedKey) => {
  if (!subscriptionKey) {
    return false;
  }
  const current = new Uint8Array(subscriptionKey);
  if (current.length !== expectedKey.length) {
    return false;
  }
  return current.every((byte, index) => byte === expectedKey[index]);
};

export const isPushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export const getNotificationPermission = () =>
  "Notification" in window ? Notification.permission : "denied";

export const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration =
      await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.error("Falha ao registrar o service worker", err);
    return null;
  }
};

const subscribeAndPersist = async () => {
  const { data } = await api.get("/push/public-key");
  if (!data?.enabled || !data?.publicKey) {
    return { ok: false, reason: "disabled" };
  }

  const registration = await registerServiceWorker();
  if (!registration) {
    return { ok: false, reason: "unsupported" };
  }

  const applicationServerKey = urlBase64ToUint8Array(data.publicKey);
  let subscription = await registration.pushManager.getSubscription();

  // Se o servidor trocou o par VAPID, a inscricao antiga continua valida para
  // o navegador mas o envio falha com 403. Refazer e o unico caminho.
  if (
    subscription &&
    !sameKey(subscription.options?.applicationServerKey, applicationServerKey)
  ) {
    await subscription.unsubscribe();
    subscription = null;
  }

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });
  }

  await api.post("/push/subscribe", subscription.toJSON());
  return { ok: true };
};

/**
 * Precisa ser chamado a partir de um gesto do usuario: o Safari (desktop e
 * iOS) recusa requestPermission fora de um clique.
 */
export const enablePushNotifications = async () => {
  if (!isPushSupported()) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: permission };
    }
    return await subscribeAndPersist();
  } catch (err) {
    console.error("Falha ao habilitar notificacoes push", err);
    return { ok: false, reason: "error" };
  }
};

/**
 * Reaproveita uma permissao ja concedida para recriar a inscricao no login.
 * Nao pede permissao, entao pode rodar na montagem do componente.
 */
export const syncPushSubscription = async () => {
  if (!isPushSupported() || getNotificationPermission() !== "granted") {
    return { ok: false, reason: "not-granted" };
  }
  try {
    return await subscribeAndPersist();
  } catch (err) {
    console.error("Falha ao sincronizar a inscricao de push", err);
    return { ok: false, reason: "error" };
  }
};

/**
 * Indica se ESTE dispositivo ja tem inscricao de push. Serve para o sistema
 * nao exibir a notificacao local em cima da que vai chegar pelo push, o que
 * faria o aparelho alertar duas vezes pela mesma mensagem.
 */
export const hasActivePushSubscription = async () => {
  if (!isPushSupported() || getNotificationPermission() !== "granted") {
    return false;
  }
  try {
    const registration =
      await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
    const subscription = await registration?.pushManager.getSubscription();
    return Boolean(subscription);
  } catch (err) {
    return false;
  }
};

/**
 * Numero no icone do app. Com o sistema aberto quem manda na contagem e a
 * tela, que conhece os tickets de verdade; o service worker so cuida disso
 * enquanto o app esta fechado.
 */
export const updateAppBadge = async count => {
  if (!("setAppBadge" in navigator)) {
    return;
  }
  try {
    if (count > 0) {
      await navigator.setAppBadge(count);
    } else {
      await navigator.clearAppBadge();
    }
  } catch (err) {
    // Badging indisponivel neste contexto: nada mais a fazer.
  }
};

export const disablePushNotifications = async () => {
  if (!isPushSupported()) {
    return;
  }
  try {
    const registration =
      await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) {
      return;
    }
    await api.post("/push/unsubscribe", { endpoint: subscription.endpoint });
    await subscription.unsubscribe();
  } catch (err) {
    console.error("Falha ao desabilitar notificacoes push", err);
  }
};

/**
 * Notificacao com o app aberto. O iOS nao implementa o construtor
 * `new Notification()` nem dentro do PWA instalado: la o unico caminho e o
 * showNotification do service worker.
 */
export const showLocalNotification = async (
  title,
  { tag, url, ...options }
) => {
  if (getNotificationPermission() !== "granted") {
    return;
  }

  const notificationOptions = {
    ...options,
    data: { url }
  };

  if (tag) {
    notificationOptions.tag = String(tag);
    notificationOptions.renotify = true;
  }

  if ("serviceWorker" in navigator) {
    const registration =
      await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
    if (registration) {
      await registration.showNotification(title, notificationOptions);
      return;
    }
  }

  try {
    const notification = new Notification(title, notificationOptions);
    notification.onclick = event => {
      event.preventDefault();
      window.focus();
      if (url) {
        window.location.assign(url);
      }
    };
  } catch (err) {
    console.error("Falha ao exibir a notificacao do navegador", err);
  }
};

export const closeLocalNotification = async tag => {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  try {
    const registration =
      await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
    const notifications = await registration?.getNotifications({
      tag: String(tag)
    });
    notifications?.forEach(notification => notification.close());
  } catch (err) {
    console.error("Falha ao fechar a notificacao", err);
  }
};
