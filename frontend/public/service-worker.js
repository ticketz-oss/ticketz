async function getManifest() {
  const response = await fetch('/manifest.json');
  if (response.ok) {
    return await response.json();
  }
  return null;
}

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification?.data?.url;
  if (url) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsList => {
        if (clientsList.length > 0) {
          const client = clientsList[0];
          const parsedUrl = new URL(url);
          const path = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
          client.postMessage({ type: 'navigate', path });
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
      const icon = payload.profileImage || manifest?.icons?.[0]?.src || '/favicon.ico';
      const data = payload.url && { url: payload.url } || undefined;
      const body = payload.body || 'You have a new message';
      self.registration.showNotification(appName, {
        body,
        icon,
        data
      });
    })()
  );
});
