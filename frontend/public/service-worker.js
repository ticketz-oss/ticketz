async function getManifest() {
  const response = await fetch('/manifest.json');
  if (response.ok) {
    return await response.json();
  }
  return null;
}

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification?.data?.url;
  if (url) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsList => {
        if (clientsList.length > 0) {
          const client = clientsList[0];
          client.postMessage({ type: 'navigate', url });
          return client.focus();
        } else {
          return clients.openWindow(url);
        }
      })
    );
  }
});

self.addEventListener('push', event => {
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });
      const isFocused = clientList.some(client => client.focused);
      if (isFocused) {
        // Do not show notification if a window client is focused.
        return;
      }
      const manifest = await getManifest();
      const appName = manifest?.name || 'Chat App';
      const payload = event.data ? event.data.json() : {};
      const icon = payload.profileImage || manifest?.icons?.[0]?.src || undefined;
      const image = payload.image || undefined;
      const badge = manifest?.icons?.[0]?.src || undefined;
      const tag = payload.ticketUuid;

      let payloadBody = payload.body;
      const existingNotifications = await self.registration.getNotifications({ tag });
      if (existingNotifications.length) {
        const existingBody = existingNotifications[0].data.body;
        payloadBody = `${existingBody}\n${payload.body}`;
        existingNotifications.forEach(notification => notification.close());
      }

      const data = {
        sender: payload.sender,
        body: payloadBody,
        url: `/tickets/${payload.ticketUuid}`
      };

      const body = `${payload.senderName}:\n\n${data.body}` || 'You have a new message';

      self.registration.showNotification(appName, {
        body,
        icon,
        image,
        badge,
        data,
        tag: payload.ticketUuid || undefined,
      });
    })()
  );
});
