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

self.addEventListener('message', event => {
  if (event.data === 'clear-notifications') {
    self.registration.getNotifications().then(notifications => {
      notifications.forEach(notification => notification.close());
    });
  }
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

const pendingNotifications = {};
const notificationTimers = {};

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    if (!event.data) {
      return;
    }
    const payload = event.data.json();
    
    if (payload.action === 'clear-notifications') {
      self.registration.getNotifications({ tag: payload.tag }).then(notifications => {
        notifications.forEach(notification => notification.close());
      });
      return;
    }
      
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
    
    const appName = manifest?.short_name || manifest?.name || undefined;
    
    const title = `${payload.senderName}${appName ? ` | ${appName}` : ''}`;
    const icon = payload.profileImage || manifest?.icons?.[0]?.src || undefined;
    const image = payload.image || undefined;
    const badge = manifest?.icons?.[0]?.src || undefined;
    const tag = payload.tag;
    const timestamp = payload.timestamp || undefined;

    // Prepare notification options.
    const dataUrl = `/tickets/${payload.ticketUuid}`;
    const newNotification = {
      body: payload.body || 'You have a new message',
      icon,
      image,
      badge,
      data: {
        body: payload.body || 'You have a new message',
        url: dataUrl
      },
      tag,
      timestamp
    };

    // If there's an existing scheduled notification for this tag, update its body.
    if (pendingNotifications[tag]) {
      pendingNotifications[tag].body += '\n' + newNotification.body;
      pendingNotifications[tag].data.body = pendingNotifications[tag].body;
      pendingNotifications[tag].image = image || pendingNotifications[tag].image;
      pendingNotifications[tag].timestamp = timestamp;
    } else {
      pendingNotifications[tag] = newNotification;
    }

    // Clear any previous timer and schedule a new one.
    if (notificationTimers[tag]) {
      clearTimeout(notificationTimers[tag]);
    }
    notificationTimers[tag] = setTimeout(() => {
      self.registration.getNotifications({ tag }).then(existingNotifications => {
        if (existingNotifications.length) {
          const existingBody = existingNotifications[0].data.body;
          existingNotifications.forEach(notification => notification.close());
          pendingNotifications[tag].body = existingBody + '\n' + pendingNotifications[tag].body;
          pendingNotifications[tag].data.body = pendingNotifications[tag].body;
        }

        self.registration.showNotification(title, pendingNotifications[tag]);
        delete pendingNotifications[tag];
        delete notificationTimers[tag];
      });
    }, 500);
  })());
});
