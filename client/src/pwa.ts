import { Workbox } from 'workbox-window';

// Check if the service worker API is supported
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js');

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        // New version installed and will be used after refreshing
        if (confirm('New app version available! Click OK to refresh.')) {
          window.location.reload();
        }
      }
    });

    wb.register()
      .then(() => console.log('Service Worker registered successfully'))
      .catch((error) => console.log('Service Worker registration failed:', error));
  }
}