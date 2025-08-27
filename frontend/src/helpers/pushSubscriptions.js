function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function serviceWorkerRegistration(timeout = 1000) {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Service worker ready timeout')), timeout)
    )
  ]).catch(() => {
    return null;
  });
}

export async function clearPushSubscription() {
  const registration = await serviceWorkerRegistration();
  
  if (!registration) {
    return null;
  }
  
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();
  }
  return null;
}

export async function ensureSubscribed(vapidPublicKey) {
  const registration = await serviceWorkerRegistration();
  
  if (!registration) {
    throw new Error('Service worker registration not found');
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });
  }

  return subscription;
}
