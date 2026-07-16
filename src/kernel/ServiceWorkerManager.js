import { EventBus } from './SystemEventBus.js';

export class ServiceWorkerManager {
    static async init() {
        // 1. Check if the browser supports Service Workers
        if (!('serviceWorker' in navigator)) {
            console.warn('[ServiceWorkerManager] Service Worker not supported');
            return;
        }

        try {
            // 2. Register the Service Worker script
            // The scope '/' means it can intercept requests for the entire site
            const reg = await navigator.serviceWorker.register('./sw.js', {
                scope: '/'
            });
            console.log('[ServiceWorkerManager] Registered', reg);

            // The browser automatically checks for updates on navigation/boot.
            // We can also manually check once here just to be certain.
            console.log('[ServiceWorkerManager] Checking for updates on boot...');
            EventBus.emit('kernel:boot', { message: 'Checking system cache...' });
            await reg.update();

            // Only handle the update process ONCE per new version
            let updateInProgress = false;

            // 4. Listen for when a new version of the Service Worker is found
            reg.addEventListener('updatefound', () => {
                if (updateInProgress) {
                    console.log('[ServiceWorkerManager] Update already in progress, skipping...');
                    return;
                }

                updateInProgress = true;
                const newWorker = reg.installing;
                console.log('[ServiceWorkerManager] UPDATE FOUND! New worker installing...');
                EventBus.emit('kernel:boot', { message: 'Downloading system update...' });

                // 5. Track the installation progress of the new worker
                newWorker.addEventListener('statechange', () => {
                    console.log(`[ServiceWorkerManager] Worker state changed: ${newWorker.state}`);

                    // Once the new worker is fully installed and ready
                    if (newWorker.state === 'installed') {
                        console.log('[ServiceWorkerManager] NEW VERSION INSTALLED!');
                        EventBus.emit('kernel:boot', { message: 'Applying system update...' });

                        // Tell the new worker to take over immediately (skip the waiting phase)
                        if (reg.waiting) {
                            console.log('[ServiceWorkerManager] Telling waiting worker to take over...');
                            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                        } else {
                            console.log('[ServiceWorkerManager] Telling new worker to activate...');
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }

                        // 6. Reload the page so the user sees the latest version
                        console.log('[ServiceWorkerManager] RELOADING PAGE...');
                        EventBus.emit('kernel:boot', { message: 'Restarting system...' });
                        setTimeout(() => window.location.reload(), 300);
                    }
                }, { once: true }); // Only listen once to avoid duplicate reloads
            });

            // Listen for when the new Service Worker officially takes control of the page
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('[ServiceWorkerManager] CONTROLLER CHANGED - NEW SERVICE WORKER IS ACTIVE');
            });

        } catch (err) {
            console.error('[ServiceWorkerManager] Registration failed', err);
        }
    }
}