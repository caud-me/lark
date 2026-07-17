const CACHE_NAME = 'v107';
const ASSETS_TO_CACHE = [
    './index.html',
    './hdd.webp',
    './manifest.json',
    './sw.js',
    './src/apps/system/EventViewer.js',
    './src/apps/system/FileManager.js',
    './src/apps/system/Settings.js',
    './src/apps/system/SoftwareCenter.js',
    './src/apps/system/TaskManager.js',
    './src/apps/system/Terminal.js',
    './src/apps/system/TextEdit.js',
    './src/commands/DiskCommands.js',
    './src/commands/FileCommands.js',
    './src/commands/HelpCommands.js',
    './src/commands/IPCCommands.js',
    './src/commands/NotificationCommands.js',
    './src/commands/PowerCommands.js',
    './src/commands/ProcessCommands.js',
    './src/commands/SystemCommands.js',
    './src/commands/UserCommands.js',
    './src/config/README.md',
    './src/developer/diagnostics/Diagnostics.js',
    './src/developer/quality/ArchitectureLinter.js',
    './src/developer/quality/HealthReporter.js',
    './src/developer/quality/PLACEHOLDER.md',
    './src/developer/quality/SdkCompatibilityChecker.js',
    './src/developer/quality/test-health.js',
    './src/developer/testing/mock-projects.js',
    './src/developer/testing/PLACEHOLDER.md',
    './src/developer/testing/TestHelpers.js',
    './src/developer/DeveloperOptionsService.js',
    './src/kernel/AppRegistry.js',
    './src/kernel/BootLoader.js',
    './src/kernel/kernel.js',
    './src/kernel/ServiceRegistry.js',
    './src/kernel/SystemEventBus.js',
    './src/platform/boot/BootService.js',
    './src/platform/boot/BootSplash.js',
    './src/platform/boot/ShutdownService.js',
    './src/platform/capabilities/providers/CapabilityProvider.js',
    './src/platform/capabilities/providers/ClipboardCapabilityProvider.js',
    './src/platform/capabilities/providers/DialogCapabilityProvider.js',
    './src/platform/capabilities/providers/NetworkCapabilityProvider.js',
    './src/platform/capabilities/providers/NotificationCapabilityProvider.js',
    './src/platform/capabilities/CapabilityRegistry.js',
    './src/platform/capabilities/CapabilityService.js',
    './src/platform/clipboard/ClipboardManager.js',
    './src/platform/clipboard/ClipboardService.js',
    './src/platform/contextmenu/ContextMenuManager.js',
    './src/platform/contextmenu/ContextMenuService.js',
    './src/platform/desktop/shell/ShutdownScreen.js',
    './src/platform/desktop/shell/Taskbar.js',
    './src/platform/desktop/shell/Wallpaper.js',
    './src/platform/desktop/DesktopEnvironmentService.js',
    './src/platform/desktop/StartupApplicationService.js',
    './src/platform/dialog/DialogManager.js',
    './src/platform/dialog/DialogService.js',
    './src/platform/environments/desktop/Desktop.js',
    './src/platform/environments/desktop/DesktopEnvironmentRegistry.js',
    './src/platform/environments/platform/Lock.js',
    './src/platform/environments/platform/Login.js',
    './src/platform/environments/platform/OOBE.js',
    './src/platform/environments/platform/PlatformEnvironmentRegistry.js',
    './src/platform/environments/platform/Recovery.js',
    './src/platform/environments/platform/Shutdown.js',
    './src/platform/environments/platform/Welcome.js',
    './src/platform/environments/EnvironmentManager.js',
    './src/platform/extensions/ExtensionRepositoryManager.js',
    './src/platform/extensions/ExtensionService.js',
    './src/platform/filesystem/validation/rules/ExtensionRule.js',
    './src/platform/filesystem/validation/rules/PermissionRule.js',
    './src/platform/filesystem/validation/rules/RequiredFieldRule.js',
    './src/platform/filesystem/validation/rules/RuntimeRule.js',
    './src/platform/filesystem/validation/rules/SdkVersionRule.js',
    './src/platform/filesystem/validation/ManifestValidator.js',
    './src/platform/filesystem/DiskManager.js',
    './src/platform/filesystem/DiskService.js',
    './src/platform/filesystem/FileService.js',
    './src/platform/ipc/CommandService.js',
    './src/platform/ipc/IPCManager.js',
    './src/platform/ipc/IPCService.js',
    './src/platform/logging/ErrorService.js',
    './src/platform/logging/LogManager.js',
    './src/platform/logging/LogService.js',
    './src/platform/network/DownloadService.js',
    './src/platform/network/NetworkManager.js',
    './src/platform/network/NetworkService.js',
    './src/platform/notifications/NotificationCenter.js',
    './src/platform/notifications/NotificationManager.js',
    './src/platform/notifications/NotificationService.js',
    './src/platform/packages/loaders/BuiltinRuntimeLoader.js',
    './src/platform/packages/loaders/LrfsRuntimeLoader.js',
    './src/platform/packages/repositories/packages/example.notes.ldepkg',
    './src/platform/packages/repositories/sources/BuiltinRepositorySource.js',
    './src/platform/packages/repositories/official.json',
    './src/platform/packages/ApplicationDatabaseManager.js',
    './src/platform/packages/ApplicationDatabaseService.js',
    './src/platform/packages/ApplicationIntentService.js',
    './src/platform/packages/ApplicationService.js',
    './src/platform/packages/AssociationService.js',
    './src/platform/packages/PackageService.js',
    './src/platform/packages/PermissionManager.js',
    './src/platform/packages/PermissionService.js',
    './src/platform/packages/RepositoryManager.js',
    './src/platform/packages/RepositoryService.js',
    './src/platform/packages/RuntimeLoaderManager.js',
    './src/platform/packages/RuntimeLoaderService.js',
    './src/platform/packages/TrustManager.js',
    './src/platform/packages/TrustService.js',
    './src/platform/process/ProcessManager.js',
    './src/platform/recovery/RecoveryManager.js',
    './src/platform/recovery/RecoveryService.js',
    './src/platform/recovery/RestoreManager.js',
    './src/platform/recovery/RestoreService.js',
    './src/platform/search/providers/ApplicationSearchProvider.js',
    './src/platform/search/providers/CommandSearchProvider.js',
    './src/platform/search/providers/FileSearchProvider.js',
    './src/platform/search/providers/PackageSearchProvider.js',
    './src/platform/search/providers/SessionSearchProvider.js',
    './src/platform/search/CommandPalette.js',
    './src/platform/search/SearchService.js',
    './src/platform/security/SecurityManager.js',
    './src/platform/security/SecurityService.js',
    './src/platform/session/PowerService.js',
    './src/platform/session/SessionManager.js',
    './src/platform/session/SessionService.js',
    './src/platform/session/UserEnvironmentService.js',
    './src/platform/settings/SettingsComponents.js',
    './src/platform/settings/SettingsManager.js',
    './src/platform/settings/SettingsService.js',
    './src/platform/shortcuts/ShortcutManager.js',
    './src/platform/shortcuts/ShortcutService.js',
    './src/platform/theming/themes/BuiltinThemeSource.js',
    './src/platform/theming/ThemeRepositoryManager.js',
    './src/platform/theming/ThemeService.js',
    './src/platform/users/UserManager.js',
    './src/platform/users/UserProfileManager.js',
    './src/platform/users/UserProfileService.js',
    './src/platform/users/UserService.js',
    './src/platform/users/UserSettingsManager.js',
    './src/platform/users/UserSettingsService.js',
    './src/platform/widgets/CalendarWidget.js',
    './src/platform/widgets/ClockWidget.js',
    './src/platform/widgets/NotesWidget.js',
    './src/platform/widgets/WeatherWidget.js',
    './src/platform/widgets/WidgetManager.js',
    './src/platform/widgets/WidgetRegistry.js',
    './src/platform/widgets/WidgetService.js',
    './src/platform/window/dialogs/OpenWithDialog.js',
    './src/platform/window/dialogs/PropertiesDialog.js',
    './src/platform/window/WindowFrame.js',
    './src/platform/window/WindowManager.js',
    './src/platform/window/WindowService.js',
    './src/policies/InputPolicy.js',
    './src/policies/ProcessPolicy.js',
    './src/policies/RecoveryPolicy.js',
    './src/policies/RestorePolicy.js',
    './src/policies/SecurityPolicy.js',
    './src/sdk/builders/ManifestBuilder.js',
    './src/sdk/registry/ApiRegistry.js',
    './src/sdk/templates/background/App.js',
    './src/sdk/templates/background/manifest.json',
    './src/sdk/templates/background/README.md',
    './src/sdk/templates/dialog/App.js',
    './src/sdk/templates/dialog/manifest.json',
    './src/sdk/templates/dialog/README.md',
    './src/sdk/templates/minimal/App.js',
    './src/sdk/templates/minimal/manifest.json',
    './src/sdk/templates/minimal/README.md',
    './src/sdk/templates/search-provider/manifest.json',
    './src/sdk/templates/search-provider/README.md',
    './src/sdk/templates/search-provider/SearchProvider.js',
    './src/sdk/templates/widget/manifest.json',
    './src/sdk/templates/widget/README.md',
    './src/sdk/templates/widget/Widget.js',
    './src/sdk/index.js',
    './src/services/ProcessService.js',
    './src/storage/LocalStorageDriver.js',
    './src/storage/LRFS.js',
    './src/system/BootLogger.js',
    './src/system/BootMode.js',
    './src/system/Environment.js',
    './src/system/EnvironmentType.js',
    './src/system/LogCategory.js',
    './src/system/LogSeverity.js',
    './src/system/SystemVersion.js',
    './src/system/WindowStates.js',
    './src/ui/omni.css',
    './src/ui/sfi.ttf',
    './src/ui/theme.css',
    './assets/icons/icon.svg',
    './docs/sdk/application-lifecycle.md',
    './docs/sdk/architecture-principles.md',
    './docs/sdk/capability-framework.md',
    './docs/sdk/component-lifecycle.md',
    './docs/sdk/extension-framework.md',
    './docs/sdk/manifests.md',
    './docs/sdk/shell-primitives.md',
    './docs/sdk/theme-integration.md',
    './docs/apps.md',
    './docs/architecture.md',
    './docs/backlog.md',
    './docs/constitution.md',
    './docs/design.md',
    './docs/lde-startup-flow.md',
    './docs/LDE_CAKE.md',
    './docs/phases.md'
];

// 1. Install Event: Triggered when the browser sees this version of the Service Worker for the first time.
// We use this phase to fetch all the files in ASSETS_TO_CACHE and save them to the browser's local cache.
self.addEventListener('install', event => {
    console.log(`[Service Worker] Installing new cache version: ${CACHE_NAME}`);
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return Promise.all(
                [...new Set(ASSETS_TO_CACHE)].map(url => {
                    // We append ?cb=Date.now() to bypass the browser's HTTP cache 
                    // and ensure we download the truly latest version from the server.
                    return fetch(url + '?cb=' + Date.now(), { cache: 'no-store' }).then(response => {
                        if (!response.ok) throw new Error('Fetch failed for ' + url);
                        return cache.put(url, response);
                    });
                })
            );
        }).then(() => {
            console.log('[Service Worker] Install complete. Skipping wait...');
            // Force the waiting service worker to become the active service worker.
            self.skipWaiting();
        })
    );
});

// 2. Activate Event: Triggered when this Service Worker officially takes control.
// We use this phase to clean up any old, outdated caches so we don't waste disk space.
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    // If we find a cache that doesn't match our current CACHE_NAME, delete it.
                    if (key !== CACHE_NAME) {
                        console.log(`[Service Worker] CACHE UPDATED! Deleting old cache: ${key}`);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => {
            console.log(`[Service Worker] NOW USING CACHE: ${CACHE_NAME}`);
            // Take control of all open pages immediately
            return self.clients.claim();
        })
    );
});

// 3. Message Event: Allows the webpage (ServiceWorkerManager) to send commands to the worker.
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[Service Worker] Received SKIP_WAITING message');
        self.skipWaiting();
    }
});

// 4. Fetch Event: Intercepts every single network request made by the OS.
// We try to serve the file from our local cache first. If it's missing, we fetch it from the network.
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true })
            .then(response => response || fetch(event.request))
            .catch(err => {
                // If the user is entirely offline and requests a file we don't have, fallback to index.html
                console.warn('[Service Worker] Network fetch failed, serving fallback:', err);
                return caches.match('./index.html', { ignoreSearch: true });
            })
    );
});
