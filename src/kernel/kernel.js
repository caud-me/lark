import { ServiceRegistry } from './ServiceRegistry.js';
import { EventBus } from './SystemEventBus.js';
import { SYSTEM_INFO } from '../system/SystemVersion.js';

/**
 * Kernel
 *
 * Responsibility:
 * Coordinates OS startup, initializes managers and services, and owns the system lifecycle.
 *
 * Does NOT:
 * - Implement business logic or features
 */
class Kernel {
    constructor() {
        this.managers = new Map();
        this.state = 'UNINITIALIZED';
    }

    /**
     * Initialize the Kernel and bootstrap the OS.
     */
    async bootstrap() {
        this.state = 'BOOTING';
        const bootStart = performance.now();
        const { BootLogger } = await import('../system/BootLogger.js');
        BootLogger.phase('KERNEL');
        BootLogger.success('Beginning bootstrap sequence...');

        this.bootStages = [
            { id: 'storage', name: 'Storage subsystem', run: () => this.initStorage() },
            { id: 'managers', name: 'State Managers', run: () => this.initManagers() },
            { id: 'services', name: 'System Services', run: () => this.initServices() },
            { id: 'applications', name: 'Application Startup', run: () => this.startApplications() }
        ];
        
        this.bootDiagnostics = [];

        try {
            for (const stage of this.bootStages) {
                const stageStart = performance.now();
                await stage.run();
                const stageEnd = performance.now();
                const duration = (stageEnd - stageStart).toFixed(2);
                this.bootDiagnostics.push({ name: stage.name, duration });
            }
            
            const bootEnd = performance.now();
            const totalBoot = (bootEnd - bootStart).toFixed(2);
            
            let summaryMsg = 'Boot Summary:\n';
            this.bootDiagnostics.forEach(d => {
                summaryMsg += `✓ ${d.name.padEnd(20)} ${d.duration}ms\n`;
            });
            summaryMsg += `\nTotal Boot: ${totalBoot}ms`;
            
            this.state = 'RUNNING';
            EventBus.emit('boot.completed', { severity: 'Info', source: 'Kernel', message: summaryMsg });
            
            // Mark BootLogger inactive to enforce the architectural boundary (handoff complete)
            const { BootLogger } = await import('../system/BootLogger.js');
            BootLogger.deactivate();
        } catch (error) {
            this.state = 'PANIC';
            this.panic(error);
        }
    }

    async startApplications() {
        const bootService = ServiceRegistry.get('BootService');
        if (bootService) {
            await bootService.start();
        } else {
            throw new Error('[Kernel] BootService not found.');
        }
    }

    async initStorage() {
        const { BootLogger } = await import('../system/BootLogger.js');
        const { LocalStorageDriver } = await import('../storage/LocalStorageDriver.js');
        const { LRFS } = await import('../storage/LRFS.js');
        
        const driver = new LocalStorageDriver();
        this.lrfs = new LRFS(driver);
        await this.lrfs.mount();
        BootLogger.success('Storage subsystem mounted.');
    }

    async initManagers() {
        const { BootLogger } = await import('../system/BootLogger.js');
        const { NetworkManager } = await import('../platform/network/NetworkManager.js');
        const { LogManager } = await import('../platform/logging/LogManager.js');
        const { WindowManager } = await import('../platform/window/WindowManager.js');
        const { ProcessManager } = await import('../platform/process/ProcessManager.js');
        const { SettingsManager } = await import('../platform/settings/SettingsManager.js');
        const { UserManager } = await import('../platform/users/UserManager.js');
        const { UserProfileManager } = await import('../platform/users/UserProfileManager.js');
        const { TrustManager } = await import('../platform/packages/TrustManager.js');
        const { DiskManager } = await import('../platform/filesystem/DiskManager.js');
        const { ApplicationDatabaseManager } = await import('../platform/packages/ApplicationDatabaseManager.js');

        const { RuntimeLoaderManager } = await import('../platform/packages/RuntimeLoaderManager.js');
        const { BuiltinRuntimeLoader } = await import('../platform/packages/loaders/BuiltinRuntimeLoader.js');
        const { LrfsRuntimeLoader } = await import('../platform/packages/loaders/LrfsRuntimeLoader.js');
        const { RepositoryManager } = await import('../platform/packages/RepositoryManager.js');
        const { SessionManager } = await import('../platform/session/SessionManager.js');
        const { BuiltinRepositorySource } = await import('../platform/packages/repositories/sources/BuiltinRepositorySource.js');
        const { PermissionManager } = await import('../platform/packages/PermissionManager.js');
        const { SecurityManager } = await import('../platform/security/SecurityManager.js');
        const { RecoveryManager } = await import('../platform/recovery/RecoveryManager.js');
        const { RestoreManager } = await import('../platform/recovery/RestoreManager.js');
        const { AppRegistry } = await import('./AppRegistry.js');
        const { IPCManager } = await import('../platform/ipc/IPCManager.js');
        const { NotificationManager } = await import('../platform/notifications/NotificationManager.js');

        const { DialogManager } = await import('../platform/dialog/DialogManager.js');
        const { ContextMenuManager } = await import('../platform/contextmenu/ContextMenuManager.js');
        const { ClipboardManager } = await import('../platform/clipboard/ClipboardManager.js');
        const { ShortcutManager } = await import('../platform/shortcuts/ShortcutManager.js');
        const { ThemeRepositoryManager } = await import('../platform/theming/ThemeRepositoryManager.js');
        const { UserSettingsManager } = await import('../platform/users/UserSettingsManager.js');
        const { BuiltinThemeSource } = await import('../platform/theming/themes/BuiltinThemeSource.js');
        const { WidgetManager } = await import('../platform/widgets/WidgetManager.js');
        const { ExtensionRepositoryManager } = await import('../platform/extensions/ExtensionRepositoryManager.js');
        const { EnvironmentManager } = await import('../platform/environments/EnvironmentManager.js');

        this.managers.set('LogManager', new LogManager());
        this.networkManager = new NetworkManager();
        this.managers.set('NetworkManager', this.networkManager);
        this.managers.set('WindowManager', new WindowManager());
        this.managers.set('DialogManager', new DialogManager());
        this.managers.set('EnvironmentManager', new EnvironmentManager());
        this.managers.set('ContextMenuManager', new ContextMenuManager());
        this.managers.set('ClipboardManager', new ClipboardManager());
        this.managers.set('ShortcutManager', new ShortcutManager());
        this.managers.set('ProcessManager', new ProcessManager());
        this.managers.set('IPCManager', new IPCManager());
        this.managers.set('NotificationManager', new NotificationManager());
        this.managers.set('SettingsManager', new SettingsManager());
        this.managers.set('UserManager', new UserManager());
        
        this.themeRepositoryManager = new ThemeRepositoryManager();
        this.themeRepositoryManager.registerSource('builtin', new BuiltinThemeSource());
        this.managers.set('ThemeRepositoryManager', this.themeRepositoryManager);

        this.widgetManager = new WidgetManager();
        this.managers.set('WidgetManager', this.widgetManager);
        
        const sessionManager = new SessionManager();
        sessionManager.startSystemSession();
        this.managers.set('SessionManager', sessionManager);
        
        this.managers.set('DiskManager', new DiskManager());

        this.permissionManager = new PermissionManager();
        this.managers.set('PermissionManager', this.permissionManager);

        this.userManager = new UserManager();
        this.managers.set('UserManager', this.userManager);

        this.userProfileManager = new UserProfileManager();
        this.managers.set('UserProfileManager', this.userProfileManager);

        this.userSettingsManager = new UserSettingsManager();
        this.managers.set('UserSettingsManager', this.userSettingsManager);
        
        this.securityManager = new SecurityManager();
        this.managers.set('SecurityManager', this.securityManager);

        this.trustManager = new TrustManager();
        this.managers.set('TrustManager', this.trustManager);
        
        this.recoveryManager = new RecoveryManager();
        this.managers.set('RecoveryManager', this.recoveryManager);

        this.restoreManager = new RestoreManager();
        this.managers.set('RestoreManager', this.restoreManager);

        this.appDbManager = new ApplicationDatabaseManager();
        this.managers.set('ApplicationDatabaseManager', this.appDbManager);
        
        this.extensionRepositoryManager = new ExtensionRepositoryManager(this.appDbManager);
        this.managers.set('ExtensionRepositoryManager', this.extensionRepositoryManager);
        

        this.repositoryManager = new RepositoryManager();
        this.repositoryManager.registerSource('builtin-official', new BuiltinRepositorySource('/src/platform/packages/repositories/official.json'));
        this.managers.set('RepositoryManager', this.repositoryManager);

        this.runtimeLoaderManager = new RuntimeLoaderManager();
        this.runtimeLoaderManager.registerLoader('builtin', new BuiltinRuntimeLoader());
        this.runtimeLoaderManager.registerLoader('lrfs', new LrfsRuntimeLoader(this.lrfs));
        this.managers.set('RuntimeLoaderManager', this.runtimeLoaderManager);
        
        this.appRegistry = new AppRegistry();
        BootLogger.success('State Managers initialized.');
    }

    async initServices() {
        const { BootLogger } = await import('../system/BootLogger.js');
        BootLogger.phase('PLATFORM');

        await this._initCoreServices();
        await this._initUserServices();
        await this._initFilesystemServices();
        await this._initApplicationServices();
        await this._initDesktopPlatform();
        await this._initCapabilities();

        // Load users from disk now that FileService is available.
        // UserManager is a pure in-memory store — UserService owns persistence.
        const userService = ServiceRegistry.get('UserService');
        if (userService) {
            userService.loadUsersFromDisk();
        }

        const { BootLogger: BL } = await import('../system/BootLogger.js');
        BL.success('Platform Services registered.');
    }

    /**
     * Core infrastructure: networking, logging, windowing, input handling, and session security.
     * These are the lowest-level platform services that everything else depends on.
     */
    async _initCoreServices() {
        const { NetworkService } = await import('../platform/network/NetworkService.js');
        const { DownloadService } = await import('../platform/network/DownloadService.js');
        const { LogService } = await import('../platform/logging/LogService.js');
        const { WindowService } = await import('../platform/window/WindowService.js');
        const { DialogService } = await import('../platform/dialog/DialogService.js');
        const { ContextMenuService } = await import('../platform/contextmenu/ContextMenuService.js');
        const { ClipboardService } = await import('../platform/clipboard/ClipboardService.js');
        const { ShortcutService } = await import('../platform/shortcuts/ShortcutService.js');
        const { SessionService } = await import('../platform/session/SessionService.js');
        const { SecurityService } = await import('../platform/security/SecurityService.js');
        const { SecurityPolicy } = await import('../policies/SecurityPolicy.js');
        const { ErrorService } = await import('../platform/logging/ErrorService.js');
        const { BootLogger } = await import('../system/BootLogger.js');

        ServiceRegistry.register('ErrorService', new ErrorService(ServiceRegistry));
        ServiceRegistry.register('EnvironmentManager', this.managers.get('EnvironmentManager'));

        const networkService = new NetworkService(this.managers.get('NetworkManager'));
        ServiceRegistry.register('NetworkService', networkService);

        const downloadService = new DownloadService(networkService);
        ServiceRegistry.register('DownloadService', downloadService);

        const logService = new LogService(this.managers.get('LogManager'));
        ServiceRegistry.register('LogService', logService);
        BootLogger.flush(logService);

        // Wire the service registry into WindowManager so it can resolve the host
        const windowManager = this.managers.get('WindowManager');
        if (windowManager) {
            windowManager.registry = ServiceRegistry;
        }
        ServiceRegistry.register('WindowService', new WindowService(windowManager, ServiceRegistry));

        // Wire the service registry into DialogManager so it can resolve the environment context
        const dialogManager = this.managers.get('DialogManager');
        if (dialogManager) {
            dialogManager.registry = ServiceRegistry;
        }
        ServiceRegistry.register('DialogService', new DialogService(dialogManager));
        ServiceRegistry.register('ContextMenuService', new ContextMenuService(this.managers.get('ContextMenuManager')));
        ServiceRegistry.register('ClipboardService', new ClipboardService(this.managers.get('ClipboardManager')));
        ServiceRegistry.register('ShortcutService', new ShortcutService(this.managers.get('ShortcutManager')));
        ServiceRegistry.register('SessionService', new SessionService(this.managers.get('SessionManager'), this.managers.get('UserManager'), ServiceRegistry));

        const securityService = new SecurityService(this.managers.get('SecurityManager'), this.managers.get('ProcessManager'), this.managers.get('SessionManager'));
        ServiceRegistry.register('SecurityService', securityService);

        const securityPolicy = new SecurityPolicy(securityService);
        ServiceRegistry.register('SecurityPolicy', securityPolicy);
    }

    /**
     * User account management, user environment restoration, and boot orchestration.
     */
    async _initUserServices() {
        const { UserService } = await import('../platform/users/UserService.js');
        const { UserProfileService } = await import('../platform/users/UserProfileService.js');
        const { UserSettingsService } = await import('../platform/users/UserSettingsService.js');
        const { UserEnvironmentService } = await import('../platform/session/UserEnvironmentService.js');
        const { BootService } = await import('../platform/boot/BootService.js');

        const userService = new UserService(this.managers.get('UserManager'), ServiceRegistry);
        ServiceRegistry.register('UserService', userService);

        const userProfileService = new UserProfileService(this.managers.get('UserProfileManager'), ServiceRegistry);
        ServiceRegistry.register('UserProfileService', userProfileService);

        const userSettingsService = new UserSettingsService(this.managers.get('UserSettingsManager'), ServiceRegistry);
        ServiceRegistry.register('UserSettingsService', userSettingsService);

        const userEnvironmentService = new UserEnvironmentService(ServiceRegistry);
        ServiceRegistry.register('UserEnvironmentService', userEnvironmentService);

        const bootService = new BootService(ServiceRegistry);
        ServiceRegistry.register('BootService', bootService);
    }

    /**
     * Filesystem, settings, theming, widgets, IPC, notifications, and developer tooling.
     */
    async _initFilesystemServices() {
        const { FileService } = await import('../platform/filesystem/FileService.js');
        const { SettingsService } = await import('../platform/settings/SettingsService.js');
        const { DiskService } = await import('../platform/filesystem/DiskService.js');
        const { ThemeService } = await import('../platform/theming/ThemeService.js');
        const { ExtensionService } = await import('../platform/extensions/ExtensionService.js');
        const { WidgetService } = await import('../platform/widgets/WidgetService.js');
        const { IPCService } = await import('../platform/ipc/IPCService.js');
        const { NotificationService } = await import('../platform/notifications/NotificationService.js');
        const { ApplicationIntentService } = await import('../platform/packages/ApplicationIntentService.js');
        const { DeveloperOptionsService } = await import('../developer/DeveloperOptionsService.js');
        const { RecoveryPolicy } = await import('../policies/RecoveryPolicy.js');
        const { RestorePolicy } = await import('../policies/RestorePolicy.js');
        const { RecoveryService } = await import('../platform/recovery/RecoveryService.js');
        const { RestoreService } = await import('../platform/recovery/RestoreService.js');

        // FileService is registered after SessionService so it can securely resolve active session identity
        ServiceRegistry.register('FileService', new FileService(this.lrfs, ServiceRegistry));

        const settingsService = new SettingsService(this.managers.get('SettingsManager'), ServiceRegistry);
        ServiceRegistry.register('SettingsService', settingsService);
        await settingsService.initialize();

        const diskService = new DiskService(this.managers.get('DiskManager'), this.lrfs);
        ServiceRegistry.register('DiskService', diskService);
        diskService.initialize();

        const themeService = new ThemeService(this.managers.get('ThemeRepositoryManager'), ServiceRegistry);
        ServiceRegistry.register('ThemeService', themeService);

        const extensionService = new ExtensionService(this.managers.get('ExtensionRepositoryManager'));
        ServiceRegistry.register('ExtensionService', extensionService);

        const widgetService = new WidgetService(this.managers.get('WidgetManager'), extensionService, ServiceRegistry);
        ServiceRegistry.register('WidgetService', widgetService);

        ServiceRegistry.register('IPCService', new IPCService(this.managers.get('IPCManager'), ServiceRegistry));
        ServiceRegistry.register('NotificationService', new NotificationService(this.managers.get('NotificationManager')));
        ServiceRegistry.register('ApplicationIntentService', new ApplicationIntentService(ServiceRegistry));

        const devOptionsService = new DeveloperOptionsService(this.managers.get('SettingsManager'));
        ServiceRegistry.register('DeveloperOptionsService', devOptionsService);
        devOptionsService.initialize();

        const recoveryPolicy = new RecoveryPolicy(ServiceRegistry.get('SecurityService'));
        ServiceRegistry.register('RecoveryPolicy', recoveryPolicy);

        const restorePolicy = new RestorePolicy(ServiceRegistry.get('SecurityService'));
        ServiceRegistry.register('RestorePolicy', restorePolicy);

        const recoveryService = new RecoveryService(this.managers.get('RecoveryManager'), ServiceRegistry);
        ServiceRegistry.register('RecoveryService', recoveryService);

        const restoreService = new RestoreService(this.managers.get('RestoreManager'), restorePolicy, ServiceRegistry);
        ServiceRegistry.register('RestoreService', restoreService);
    }

    /**
     * Application lifecycle: app database, packages, repositories, permissions, processes, and power.
     */
    async _initApplicationServices() {
        const { ApplicationDatabaseService } = await import('../platform/packages/ApplicationDatabaseService.js');
        const { ApplicationService } = await import('../platform/packages/ApplicationService.js');
        const { AssociationService } = await import('../platform/packages/AssociationService.js');
        const { RuntimeLoaderService } = await import('../platform/packages/RuntimeLoaderService.js');
        const { PermissionService } = await import('../platform/packages/PermissionService.js');
        const { TrustService } = await import('../platform/packages/TrustService.js');
        const { PackageService } = await import('../platform/packages/PackageService.js');
        const { RepositoryService } = await import('../platform/packages/RepositoryService.js');
        const { ProcessService } = await import('../services/ProcessService.js');
        const { CommandService } = await import('../platform/ipc/CommandService.js');
        const { PowerService } = await import('../platform/session/PowerService.js');

        const appDbService = new ApplicationDatabaseService(this.appDbManager, ServiceRegistry);
        ServiceRegistry.register('ApplicationDatabaseService', appDbService);
        await appDbService.initialize();
        await appDbService.syncBuiltins(this.appRegistry.getBuiltinApplications());

        const appService = new ApplicationService(appDbService);
        ServiceRegistry.register('ApplicationService', appService);
        ServiceRegistry.register('AssociationService', new AssociationService(appService));

        const runtimeLoaderService = new RuntimeLoaderService(this.managers.get('RuntimeLoaderManager'));
        ServiceRegistry.register('RuntimeLoaderService', runtimeLoaderService);

        const permissionService = new PermissionService(this.managers.get('PermissionManager'), appService, ServiceRegistry);
        ServiceRegistry.register('PermissionService', permissionService);
        await permissionService.initialize();

        const trustService = new TrustService(this.managers.get('TrustManager'), appService);
        ServiceRegistry.register('TrustService', trustService);

        const packageService = new PackageService(ServiceRegistry.get('FileService'), ServiceRegistry);
        ServiceRegistry.register('PackageService', packageService);

        const repositoryService = new RepositoryService(this.managers.get('RepositoryManager'), ServiceRegistry.get('NetworkService'));
        ServiceRegistry.register('RepositoryService', repositoryService);

        const recoveryService = ServiceRegistry.get('RecoveryService');
        if (!recoveryService.isSafeMode()) {
            // Refresh repositories and themes asynchronously after startup
            repositoryService.refresh().catch(e => console.error('[Kernel] Failed initial repository refresh:', e));
            const themeService = ServiceRegistry.get('ThemeService');
            if (themeService) {
                themeService.refreshAll().catch(e => console.error('[Kernel] Failed to refresh themes:', e));
            }
            // Initial extension population now that the DB is ready
            this.extensionRepositoryManager.refresh();
        } else {
            EventBus.emit('kernel:safemode', { severity: 'Info', source: 'Kernel', message: 'Safe Mode active: Bypassing repository and theme sync.' });
        }

        ServiceRegistry.register('ProcessService', new ProcessService(this.managers.get('ProcessManager'), appService, ServiceRegistry, runtimeLoaderService));
        ServiceRegistry.register('CommandService', new CommandService(ServiceRegistry));
        ServiceRegistry.register('PowerService', new PowerService(this.managers.get('ProcessManager'), this.managers.get('SessionManager'), ServiceRegistry));
    }

    /**
     * Desktop environment registration, startup app orchestration, search, and input policy.
     */
    async _initDesktopPlatform() {
        const { DesktopEnvironmentService } = await import('../platform/desktop/DesktopEnvironmentService.js');
        const { StartupApplicationService } = await import('../platform/desktop/StartupApplicationService.js');
        const { DesktopEnvironmentRegistry } = await import('../platform/environments/desktop/DesktopEnvironmentRegistry.js');
        const { WidgetRegistry } = await import('../platform/widgets/WidgetRegistry.js');
        const { SearchService } = await import('../platform/search/SearchService.js');
        const { ShutdownService } = await import('../platform/boot/ShutdownService.js');
        const { InputPolicy } = await import('../policies/InputPolicy.js');

        ServiceRegistry.register('WidgetRegistry', new WidgetRegistry());

        const desktopEnvService = new DesktopEnvironmentService(ServiceRegistry);
        const desktopRegistry = new DesktopEnvironmentRegistry();
        const ldeDesktop = desktopRegistry.getEnvironment('sys.desktop');

        desktopEnvService.registerEnvironment({
            metadata: {
                id: ldeDesktop.id,
                name: ldeDesktop.name,
                version: '1.0',
                author: 'Lark OS'
            },
            create: async (registry, sessionId) => {
                const processService = registry.get('ProcessService');
                if (processService) {
                    await processService.startDesktopEnvironment(ldeDesktop, { sessionId });
                }
            },
            destroy: async (registry, sessionId) => {
                const processService = registry.get('ProcessService');
                if (processService) {
                    const proc = processService.getProcesses().find(p => p.appId === ldeDesktop.id && p.sessionId === sessionId);
                    if (proc) {
                        processService.terminateProcess(proc.pid, true);
                    }
                }
            }
        });

        ServiceRegistry.register('DesktopEnvironmentService', desktopEnvService);
        desktopEnvService.setDefaultEnvironment('sys.desktop');

        ServiceRegistry.register('ShutdownService', new ShutdownService(ServiceRegistry));
        ServiceRegistry.register('StartupApplicationService', new StartupApplicationService(ServiceRegistry));

        const searchService = new SearchService(ServiceRegistry.get('ExtensionService'), ServiceRegistry);
        ServiceRegistry.register('SearchService', searchService);
        // Trigger initial load of search providers from extensions
        searchService.loadProviders();

        // Install input routing policy — must be last so all services are registered
        new InputPolicy(ServiceRegistry);
    }

    /**
     * Capability subsystem: sandboxed access for applications to platform features
     * (network, dialogs, notifications, clipboard).
     */
    async _initCapabilities() {
        const { CapabilityRegistry } = await import('../platform/capabilities/CapabilityRegistry.js');
        const { CapabilityService } = await import('../platform/capabilities/CapabilityService.js');
        const { NetworkCapabilityProvider } = await import('../platform/capabilities/providers/NetworkCapabilityProvider.js');
        const { DialogCapabilityProvider } = await import('../platform/capabilities/providers/DialogCapabilityProvider.js');
        const { NotificationCapabilityProvider } = await import('../platform/capabilities/providers/NotificationCapabilityProvider.js');
        const { ClipboardCapabilityProvider } = await import('../platform/capabilities/providers/ClipboardCapabilityProvider.js');

        const capabilityRegistry = new CapabilityRegistry();
        capabilityRegistry.register('network', new NetworkCapabilityProvider(ServiceRegistry.get('NetworkService'), ServiceRegistry.get('DownloadService')));
        capabilityRegistry.register('dialogs', new DialogCapabilityProvider(ServiceRegistry.get('DialogService')));
        capabilityRegistry.register('notifications', new NotificationCapabilityProvider(ServiceRegistry.get('NotificationService')));
        capabilityRegistry.register('clipboard', new ClipboardCapabilityProvider(ServiceRegistry.get('ClipboardService')));

        const capabilityService = new CapabilityService(capabilityRegistry);
        ServiceRegistry.register('CapabilityService', capabilityService);
    }





    panic(error) {
        EventBus.emit('kernel:panic', { severity: 'Error', source: 'Kernel', message: `KERNEL PANIC: ${error.stack || error}` });
        
        let eventData = [];
        try {
            const syslogService = ServiceRegistry.get('LogService');
            if (syslogService) {
                const logs = syslogService.getLogs();
                eventData = logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.severity} [${l.source}]: ${l.message}`);
            }
        } catch(e) {}
        
        const errorStack = (error.stack || error.toString()).split('\n');
        
        const panicLines = [
            `CR0: 0x0000000080010033, CR2: 0x00000000ff5ea1fd, CR3: 0x000000000c4e9000`,
            `Fault CR2: 0x00000000ff5ea1fd, Error code: 0x0000000000000000, Fault CPU: 0x0, PL: 0, VF: 5`,
            ``,
            `Panicked task 0xffffff9d921cb290: 20 threads: pid 0:`,
            `Backtrace (CPU 0), panicked thread: 0xffffff98c54000c0, Frame : Return Address`,
            ...errorStack,
            ``,
            `Process name corresponding to current thread (0xffffff98c54000c8): Unknown`,
            `Boot args: -v debug=0x100 keepsyms=1 -lgfxblt -wegnoegpu -vi2c-force-polling`,
            ``,
            `Mac OS version:`,
            `Not yet set`,
            ``,
            `Kernel version:`,
            `LDE Kernel Version ${SYSTEM_INFO.version} (${SYSTEM_INFO.codename}): ${new Date().toUTCString()}; root:xnu-12377.41.6-2/RELEASE_X86_64`,
            `Kernel UUID: 375EF211-CCBA-3A63-9670-924A3BF74221`,
            `roots installed: 0`,
            `KernelCache slide: 0x0000000006a00000`,
            `KernelCache base:  0xffffff8006c00000`,
            `System shutdown begun: NO`,
            `Panic diags file unavailable, panic occurred prior to initialization`,
            `Hibernation exit count: 0`,
            ``,
            `System uptime in nanoseconds: ${Math.floor(performance.now() * 1000000)}`,
            `Last Sleep:           absolute           base_tsc          base_nano`,
            `  Uptime  : 0x0000000030c203b1`,
            `  Sleep   : 0x0000000000000000 0x0000000000000000 0x0000000000000000`,
            `  Wake    : 0x0000000000000000 0x00000018f4bfdd9a 0x0000000000000000`,
            ``,
            `Event Viewer Logs (LDE Syslog):`,
            ...eventData,
            ``,
            `** In Memory Panic Stackshot Succeeded ** Bytes Traced 4380 (Uncompressed 9360) **`,
            ``,
            `Please go to https://panic.lde27.com to report this panic`
        ];
        console.log(...eventData)

        document.body.innerHTML = `
            <div id="panic-screen" style="background-color: #000; color: #fff; height: 100vh; width: 100vw; font-family: monospace; font-size: 14px; font-weight: bold; position: absolute; top: 0; left: 0; z-index: 999999; overflow-y: auto; overflow-x: hidden; padding: 20px; box-sizing: border-box; line-height: 0.9; white-space: pre-wrap; word-break: break-all;">
            </div>
        `;
        
        const container = document.getElementById('panic-screen');
        let currentLine = 0;
        
        const interval = setInterval(() => {
            if (currentLine >= panicLines.length) {
                clearInterval(interval);
                return;
            }
            
            const line = document.createElement('div');
            line.textContent = panicLines[currentLine];
            // Ensure empty strings take up vertical space
            if (panicLines[currentLine] === '') {
                line.style.minHeight = '1em';
            }
            container.appendChild(line);
            
            container.scrollTop = container.scrollHeight;
            currentLine++;
        }, 15); // Fast enough to look like a dump, slow enough to see the animation
    }
}

export const coreKernel = new Kernel();
