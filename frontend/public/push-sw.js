/* global self, clients */

const DEFAULT_ICON = "/branding/icon.png";

self.addEventListener("push", event => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = { body: event.data ? event.data.text() : "Nova mensagem" };
  }

  const status = String(payload.status || "Atendimento");
  const message = String(payload.body || "Você recebeu uma nova mensagem.");
  const contactPhoto = payload.icon || DEFAULT_ICON;
  const ticketId = Number(payload.ticketId || 0);

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(windows => {
        if (windows.some(client => client.visibilityState === "visible")) {
          return undefined;
        }

        return self.registration.showNotification(
          String(payload.title || "Espaço Whats"),
          {
            body: `${status} · ${message}`,
            icon: contactPhoto,
            image: contactPhoto,
            badge: DEFAULT_ICON,
            tag: ticketId > 0 ? `ticket-${ticketId}` : "espaco-whats-test",
            renotify: true,
            data: {
              ticketId,
              ticketUuid: String(payload.ticketUuid || "")
            }
          }
        );
      })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const ticketId = Number(event.notification.data?.ticketId || 0);
  const ticketUuid = String(event.notification.data?.ticketUuid || "");
  const params = new URLSearchParams();

  if (Number.isSafeInteger(ticketId) && ticketId > 0) {
    params.set("ticketId", String(ticketId));
  }
  if (/^[0-9a-f-]{16,64}$/i.test(ticketUuid)) {
    params.set("ticketUuid", ticketUuid);
  }

  const query = params.toString();
  const destination = query ? `/mobile-open.html?${query}` : "/";

  event.waitUntil(clients.openWindow(destination));
});
