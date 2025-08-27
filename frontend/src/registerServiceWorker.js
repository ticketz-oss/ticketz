export function registerServiceWorker() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registered:', registration);
          window.addEventListener('focus', () => {
            if (registration.active) {
              registration.active.postMessage('clear-notifications');
            }
          });
        })
        .catch(error => {
          console.error('ServiceWorker registration failed:', error);
        });
    });
  } else {
    console.warn('Push messaging is not supported in this browser');
  }
}
