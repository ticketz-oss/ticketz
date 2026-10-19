/* eslint-disable no-restricted-globals */

// Service worker dedicado a notificacoes. Nao faz cache de assets: o build do
// CRA ja versiona os arquivos e um cache aqui so atrapalharia o deploy.

const DEFAULT_ICON = "/branding/icon.png";

// O numero no icone do app sai da Badging API. Como as notificacoes usam o id
// do ticket como tag, uma notificacao por ticket sobrevive na bandeja e a
// contagem delas equivale aos atendimentos com mensagem nao lida - o mesmo
// numero que o sino mostra dentro do sistema.
const updateAppBadge = async () => {
  if (!self.navigator || !("setAppBadge" in self.navigator)) {
    return;
  }
  try {
    const shown = await self.registration.getNotifications();
    if (shown.length > 0) {
      await self.navigator.setAppBadge(shown.length);
    } else {
      await self.navigator.clearAppBadge();
    }
  } catch (e) {
    // Badging nao suportado ou negado: a notificacao em si nao pode falhar.
  }
};

self.addEventListener("install", () => {
  // Assume o controle sem esperar as abas antigas fecharem, senao uma versao
  // nova do worker so passaria a valer no proximo dia de uso.
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", event => {
  if (!event.data) {
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { body: event.data.text() };
  }

  const title = payload.title || "Espaço Whats";
  const options = {
    body: payload.body || "",
    icon: payload.icon || DEFAULT_ICON,
    badge: DEFAULT_ICON,
    data: { url: payload.url || "/" }
  };

  // renotify sem tag lanca TypeError, entao os dois andam juntos: com tag, a
  // notificacao nova substitui a anterior do mesmo ticket em vez de empilhar.
  if (payload.tag) {
    options.tag = payload.tag;
    options.renotify = true;
  }

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, options);
      await updateAppBadge();
    })()
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      await updateAppBadge();

      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      for (const client of clientList) {
        if (new URL(client.url).origin !== self.location.origin) {
          continue;
        }
        await client.focus();
        if ("navigate" in client) {
          await client.navigate(targetUrl);
        }
        return;
      }

      await self.clients.openWindow(targetUrl);
    })()
  );
});
