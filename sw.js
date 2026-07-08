const CACHE_NAME = 'lde27-cache-v40';
const ASSETS_TO_CACHE = [
    './index.html',
    './manifest.json',
    './src-tree.json',
    './sw.js',
    './assets/icons/icon.svg',
    './docs/architecture.md',
    './docs/backlog.md',
    './docs/constitution.md',
    './docs/phases.md',
    './docs/project_tree.md',
    './src/apps/system/Desktop.js',
    './src/apps/system/EventViewer.js',
    './src/apps/system/FileManager.js',
    './src/apps/system/Lock.js',
    './src/apps/system/Login.js',
    './src/apps/system/OOBE.js',
    './src/apps/system/Settings.js',
    './src/apps/system/Shutdown.js',
    './src/apps/system/TaskManager.js',
    './src/apps/system/Terminal.js',
    './src/apps/system/WindowTest.js',
    './src/apps/user/VirusSimulator.js',
    './src/kernel/AppRegistry.js',
    './src/kernel/BootLoader.js',
    './src/kernel/kernel.js',
    './src/kernel/ServiceRegistry.js',
    './src/kernel/SystemEventBus.js',
    './src/managers/DialogManager.js',
    './src/managers/DiskManager.js',
    './src/managers/IPCManager.js',
    './src/managers/LogManager.js',
    './src/managers/NotificationManager.js',
    './src/managers/ProcessManager.js',
    './src/managers/SessionManager.js',
    './src/managers/SettingsManager.js',
    './src/managers/UserManager.js',
    './src/managers/WindowManager.js',
    './src/policies/InputPolicy.js',
    './src/policies/ProcessPolicy.js',
    './src/services/AppService.js',
    './src/services/CommandService.js',
    './src/services/DialogService.js',
    './src/services/DiskService.js',
    './src/services/FileService.js',
    './src/services/IPCService.js',
    './src/services/LogService.js',
    './src/services/NotificationService.js',
    './src/services/PowerService.js',
    './src/services/ProcessService.js',
    './src/services/SessionService.js',
    './src/services/SettingsService.js',
    './src/services/UserService.js',
    './src/services/WindowService.js',
    './src/services/commands/DiskCommands.js',
    './src/services/commands/FileCommands.js',
    './src/services/commands/HelpCommands.js',
    './src/services/commands/IPCCommands.js',
    './src/services/commands/NotificationCommands.js',
    './src/services/commands/PowerCommands.js',
    './src/services/commands/ProcessCommands.js',
    './src/services/commands/SystemCommands.js',
    './src/services/commands/UserCommands.js',
    './src/storage/drivers/LocalStorageDriver.js',
    './src/storage/lrfs/LRFS.js',
    './src/system/SystemVersion.js',
    './src/ui/Dock.js',
    './src/ui/NotificationCenter.js',
    './src/ui/PowerMenu.js',
    './src/ui/SettingsComponents.js',
    './src/ui/theme.css',
    './src/ui/Wallpaper.js',
    './src/ui/WindowFrame.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll([...new Set(ASSETS_TO_CACHE)]))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true })
            .then(response => response || fetch(event.request))
            .catch(err => {
                console.warn('[Service Worker] Network fetch failed, serving fallback:', err);
                return caches.match('./index.html', { ignoreSearch: true });
            })
    );
});
