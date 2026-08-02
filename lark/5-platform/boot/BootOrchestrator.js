import { EventBus } from '../../1-kernel/SystemEventBus.js';
import { BootMode } from '../../3-system/BootMode.js';
import { SYSTEM_INFO } from '../../3-system/SystemVersion.js';
import { ServiceRegistry } from '../../1-kernel/ServiceRegistry.js';
import { Environment } from '../../3-system/Environment.js';
import { EnvironmentType } from '../../3-system/EnvironmentType.js';
import { LogCategory } from '../../3-system/LogCategory.js';
import { LogSeverity } from '../../3-system/LogSeverity.js';

import { PlatformEnvironmentRegistry } from '../environments/platform/PlatformEnvironmentRegistry.js';
import { DialogSurface } from '../desktop/shell/DialogSurface.js';
import { ContextMenuSurface } from '../desktop/shell/ContextMenuSurface.js';

/**
 * Platform Environment classes are intentionally co-located in this file.
 *
 * Login, Lock, Recovery, OOBE, Welcome, and Shutdown environments are not
 * general-purpose UI environments — they are boot states owned by the boot
 * orchestration sequence. Co-locating them with BootOrchestrator keeps related
 * lifecycle logic together and avoids scattering small, boot-only classes
 * across the environments directory.
 *
 * See backlog.md entry "Evaluate extraction if BootOrchestrator exceeds readability targets"
 * for the deferred condition under which this decision should be revisited.
 */

const platformRegistry = new PlatformEnvironmentRegistry();

export class BasePlatformEnvironment extends Environment {
    constructor(id, type, registry) {
        super(id, type, registry);
        this.dialogSurface = new DialogSurface();
        this.contextMenuSurface = new ContextMenuSurface();
    }

    async mount() {
        const host = document.getElementById('platform-host') || document.body;
        this.dialogSurface.initialize(this.registry, this);
        this.dialogSurface.mount(host);

        this.contextMenuSurface.initialize(this.registry, this);
        this.contextMenuSurface.mount(host);
    }

    async resume() {
        this.dialogSurface.resume();
        this.contextMenuSurface.resume();
    }

    async suspend() {
        this.dialogSurface.suspend();
        this.contextMenuSurface.suspend();
    }

    async destroy() {
        this.dialogSurface.destroy();
        this.contextMenuSurface.destroy();
    }
}

export class LoginPlatformEnvironment extends BasePlatformEnvironment {
    constructor(registry) {
        super('login', EnvironmentType.LOGIN, registry);
        this.metadata = platformRegistry.getEnvironment('sys.login');
    }
    async mount() {
        await super.mount();
        const url = new URL(this.metadata.entryPoint.replace(/^\//, ''), window.LDE_BASE_URL).href;
        const module = await import(url);
        await module.default.run(this.registry);
    }
    async destroy() {
        await super.destroy();
        const container = document.getElementById('login-container');
        if (container) container.remove();
    }
}

export class LockPlatformEnvironment extends BasePlatformEnvironment {
    constructor(registry) {
        super('lock', EnvironmentType.LOCK, registry);
        this.metadata = platformRegistry.getEnvironment('sys.lock');
    }
    async mount() {
        await super.mount();
        const url = new URL(this.metadata.entryPoint.replace(/^\//, ''), window.LDE_BASE_URL).href;
        const module = await import(url);
        await module.default.run(this.registry);
    }
    async destroy() {
        await super.destroy();
        const container = document.getElementById('lock-container');
        if (container) container.remove();
    }
}

export class RecoveryPlatformEnvironment extends BasePlatformEnvironment {
    constructor(registry) {
        super('recovery', EnvironmentType.RECOVERY, registry);
        this.metadata = platformRegistry.getEnvironment('sys.recovery');
    }
    async mount() {
        await super.mount();
        const url = new URL(this.metadata.entryPoint.replace(/^\//, ''), window.LDE_BASE_URL).href;
        const module = await import(url);
        await module.default.run(this.registry);
    }
    async destroy() {
        await super.destroy();
        const container = document.getElementById('recovery-container');
        if (container) container.remove();
    }
}

export class SetupPlatformEnvironment extends BasePlatformEnvironment {
    constructor(registry, initialStepId = null) {
        super('setup', EnvironmentType.BOOT, registry);
        this.metadata = platformRegistry.getEnvironment('sys.setup');
        this.initialStepId = initialStepId;
    }

    async mount() {
        await super.mount();
        const { SetupEnvironment } = await import('../environments/platform/SetupEnvironment.js');
        const { PlatformEnvironmentSurface } = await import('../environments/platform/PlatformEnvironmentSurface.js');

        this.setupEnv = new SetupEnvironment(this.registry);
        if (this.initialStepId) {
            this.setupEnv.jumpToStep(this.initialStepId);
        }
        this.surface = new PlatformEnvironmentSurface();
        this.surface.initialize(this.registry, this);
        this.setupEnv.surface = this.surface;
        this.surface.setActiveEnvironment(this.setupEnv);

        const host = document.getElementById('platform-host') || document.body;
        const renderedDom = this.surface.render();

        const container = document.createElement('div');
        container.id = 'setup-container';
        container.appendChild(renderedDom);
        host.appendChild(container);

        this.surface.mount(container);
    }

    async destroy() {
        await super.destroy();
        if (this.surface) {
            this.surface.destroy();
        }
        const container = document.getElementById('setup-container');
        if (container) container.remove();
    }
}

export class OobePlatformEnvironment extends BasePlatformEnvironment {
    constructor(registry, initialStepId = 'oobeName') {
        super('oobe', EnvironmentType.BOOT, registry);
        this.metadata = platformRegistry.getEnvironment('sys.oobe');
        this.initialStepId = initialStepId;
    }

    async mount() {
        await super.mount();
        const { OobeEnvironment } = await import('../environments/platform/OobeEnvironment.js');
        const { PlatformEnvironmentSurface } = await import('../environments/platform/PlatformEnvironmentSurface.js');

        this.oobeEnv = new OobeEnvironment(this.registry, this.initialStepId);
        this.surface = new PlatformEnvironmentSurface();
        this.surface.initialize(this.registry, this);
        this.oobeEnv.surface = this.surface;
        this.surface.setActiveEnvironment(this.oobeEnv);

        const host = document.getElementById('platform-host') || document.body;
        const renderedDom = this.surface.render();

        const container = document.createElement('div');
        container.id = 'oobe-container';
        container.appendChild(renderedDom);
        host.appendChild(container);

        this.surface.mount(container);
    }

    async destroy() {
        await super.destroy();
        if (this.surface) {
            this.surface.destroy();
        }
        const container = document.getElementById('oobe-container');
        if (container) container.remove();
    }
}

export class ShutdownPlatformEnvironment extends BasePlatformEnvironment {
    constructor(registry) {
        super('shutdown', EnvironmentType.SHUTDOWN, registry);
        this.metadata = platformRegistry.getEnvironment('sys.shutdown');
    }

    async mount() {
        await super.mount();
        const url = new URL(this.metadata.entryPoint.replace(/^\//, ''), window.LDE_BASE_URL).href;
        const module = await import(url);
        module.default.run(this.registry);
    }

    async destroy() {
        await super.destroy();
        const container = document.getElementById('shutdown-container');
        if (container) container.remove();
    }
}

export class BootOrchestrator {
    constructor(serviceRegistry) {
        this.registry = serviceRegistry;

        // Apply host fallback theme when a user session ends or is suspended
        EventBus.on('session.suspended', async (payload) => {
            this.applyHostTheme();
            const { sessionId } = payload.data || {};
            const desktopEnvService = this.registry.get('DesktopEnvironmentService');
            if (desktopEnvService && sessionId) {
                await desktopEnvService.suspend(sessionId);
            }
            EventBus.emit('session.lifecycle', { category: LogCategory.SESSION, severity: LogSeverity.INFO, message: 'User session suspended.', source: 'BootOrchestrator' });

            const envManager = this.registry.get('EnvironmentManager');
            const activeEnv = envManager ? envManager.getActiveEnvironment() : null;
            if (activeEnv && activeEnv.type === EnvironmentType.SHUTDOWN) {
                return;
            }

            // Re-mount login screen
            const loginEnv = new LoginPlatformEnvironment(this.registry);
            await this.transitionTo(loginEnv);
        });

        EventBus.on('session.ended', async (payload) => {
            this.applyHostTheme();
            const { sessionId } = payload.data || {};
            const desktopEnvService = this.registry.get('DesktopEnvironmentService');
            if (desktopEnvService && sessionId) {
                await desktopEnvService.destroy(sessionId);
            }
            EventBus.emit('session.lifecycle', { category: LogCategory.SESSION, severity: LogSeverity.INFO, message: 'User session ended.', source: 'BootOrchestrator' });

            const envManager = this.registry.get('EnvironmentManager');
            const activeEnv = envManager ? envManager.getActiveEnvironment() : null;
            if (activeEnv && activeEnv.type === EnvironmentType.SHUTDOWN) {
                return;
            }

            // Re-mount login screen
            const loginEnv = new LoginPlatformEnvironment(this.registry);
            await this.transitionTo(loginEnv);
        });

        EventBus.on('system.setup.completed', async (payload) => {
            const systemContext = { identity: 'system', role: 'SYSTEM' };
            const fileService = this.registry.get('FileService');
            const userService = this.registry.get('UserService');
            const appDbService = this.registry.get('ApplicationDatabaseService');
            const permService = this.registry.get('PermissionService');
            const settingsService = this.registry.get('SettingsService');
            const userAccount = (payload && payload.data && payload.data.account) ? payload.data.account : { name: 'User', password: '' };

            if (fileService) {
                if (!fileService.exists('/system', { context: systemContext })) await fileService.createDirectory('/system', { context: systemContext });
                if (!fileService.exists('/users', { context: systemContext })) await fileService.createDirectory('/users', { context: systemContext });

                if (userService) {
                    try {
                        const username = (userAccount.name || 'user').toLowerCase().replace(/\s+/g, '');
                        userService.createUser(username || 'user', userAccount.name || 'User', userAccount.password || '', { 
                            context: systemContext,
                            passwordHint: userAccount.hint || '' 
                        });

                        // Write user settings file (/users/${username}/Settings/settings.json)
                        const userSettingsDir = `/users/${username}/Settings`;
                        const userSettingsPath = `${userSettingsDir}/settings.json`;
                        const visualEffectsEnabled = (payload && payload.data && payload.data.visualEffectsEnabled !== undefined)
                            ? Boolean(payload.data.visualEffectsEnabled)
                            : true;

                        const userSettingsData = {
                            'desktop.wallpaper': '#101010',
                            'appearance.visualEffectsEnabled': visualEffectsEnabled
                        };

                        if (!fileService.exists(userSettingsDir, { context: systemContext })) {
                            fileService.createDirectory(userSettingsDir, { context: systemContext, ownerOverride: username });
                        }
                        fileService.writeFile(userSettingsPath, JSON.stringify(userSettingsData, null, 2), { context: systemContext, ownerOverride: username });

                        const userSettingsService = this.registry.get('UserSettingsService');
                        if (userSettingsService) {
                            await userSettingsService.restore(username);
                        }
                    } catch (e) {
                        console.error('[BootOrchestrator] Failed to create user account or save settings:', e);
                    }
                }

                try {
                    fileService.writeFile('/system/installation.json', JSON.stringify({
                        installed: true,
                        setupCompleted: true,
                        version: SYSTEM_INFO.version,
                        migration: 0
                    }), { context: systemContext });
                } catch (e) {
                    console.error('[BootOrchestrator] Failed to write installation metadata:', e);
                }

                if (appDbService) await appDbService.save();
                if (permService) await permService.save();
                if (settingsService) await settingsService.save();
            }

            EventBus.emit('kernel:oobeComplete', { severity: 'Info', source: 'BootOrchestrator', message: 'Setup completed.' });

            this.applyHostTheme();
            const powerService = this.registry.get('PowerService');
            if (powerService && typeof powerService.reboot === 'function') {
                await powerService.reboot();
            } else {
                window.location.reload();
            }
        });

        /*
        EventBus.on('session.locked', async (payload) => {
            EventBus.emit('kernel:boot', { severity: 'Info', source: 'BootOrchestrator', message: 'Session locked.' });
            const lockEnv = new LockPlatformEnvironment(this.registry);
            await this.transitionTo(lockEnv);
        });

        EventBus.on('session.unlocked', async (payload) => {
            EventBus.emit('kernel:boot', { severity: 'Info', source: 'BootOrchestrator', message: 'Session unlocked.' });
            const sessionService = this.registry.get('SessionService');
            const session = sessionService ? sessionService.getCurrentSession() : null;
            if (session) {
                const desktopEnvService = this.registry.get('DesktopEnvironmentService');
                const desktopEnv = desktopEnvService ? desktopEnvService.getCurrent(session.id) : null;
                if (desktopEnv) {
                    await this.transitionTo(desktopEnv);
                }
            }
        });
        */

        EventBus.on('environment.restored', async (payload) => {
            const envManager = this.registry.get('EnvironmentManager');
            const activeEnv = envManager ? envManager.getActiveEnvironment() : null;
            if (activeEnv && activeEnv.type === EnvironmentType.SHUTDOWN) {
                return;
            }

            const { username, desktopEnvironmentId } = payload || {};
            const sessionService = this.registry.get('SessionService');
            const session = sessionService ? sessionService.getCurrentSession() : null;
            if (!session) return;

            const desktopEnvService = this.registry.get('DesktopEnvironmentService');
            if (desktopEnvService) {
                const envId = desktopEnvironmentId || 'lde';
                let desktopEnv = desktopEnvService.getCurrent(session.id);
                if (!desktopEnv) {
                    desktopEnv = await desktopEnvService.create(envId, session.id);
                }
                await this.transitionTo(desktopEnv);
            }
        });
    }

    applyHostTheme() {
        const themeService = this.registry.get('ThemeService');
        if (themeService) {
            themeService.applyTheme('dark');
        }
    }

    async transitionTo(next) {
        const envManager = this.registry.get('EnvironmentManager');
        const current = envManager ? envManager.getActiveEnvironment() : null;
        
        if (current) {
            await current.suspend();

            if (current.type !== EnvironmentType.DESKTOP) {
                await current.destroy();
            }
        }

        if (envManager && next) {
            // Must be set before mounting so InputPolicy allows user interaction during blocking mounts (like Welcome)
            envManager.setActiveEnvironment(next);
        }

        if (next) {
            if (!next.mounted) {
                await next.mount();
                next.mounted = true;
            }
            await next.resume();
        }
    }

    async start() {
        const fileService = this.registry.get('FileService');
        const recoveryService = this.registry.get('RecoveryService');
        const userService = this.registry.get('UserService');

        if (!fileService) {
            throw new Error('[BootOrchestrator] Required boot services are missing.');
        }

        const systemContext = { identity: 'system', role: 'SYSTEM' };
        EventBus.emit('kernel:boot', { severity: 'Info', source: 'BootOrchestrator', message: 'Selecting startup environment...' });

        // 1. Check Boot Mode (Safe / Recovery)
        if (recoveryService && recoveryService.isRecoveryMode()) {
            this.applyHostTheme();
            EventBus.emit('kernel:recovery', { severity: 'Warning', source: 'BootOrchestrator', message: 'Entering Recovery Mode.' });
            const recoveryEnv = new RecoveryPlatformEnvironment(this.registry);
            EventBus.emit('platform.ready', { source: 'BootOrchestrator', message: 'Recovery Environment Ready' });
            await this.transitionTo(recoveryEnv);
            return;
        }

        // 2. Check installation state (First Boot Setup vs OOBE)
        const installationPath = '/system/installation.json';
        if (!fileService.exists(installationPath, { context: systemContext })) {
            this.applyHostTheme();
            EventBus.emit('kernel:firstBoot', { severity: 'Info', source: 'BootOrchestrator', message: 'First boot detected. Initializing installer environment...' });

            const setupEnv = new SetupPlatformEnvironment(this.registry);
            EventBus.emit('platform.ready', { source: 'BootOrchestrator', message: 'Setup Environment Ready' });
            await this.transitionTo(setupEnv);
            return;
        }

        // Check if OOBE user configuration is required
        let isOobeNeeded = false;
        try {
            const rawInst = fileService.readFile(installationPath, { context: systemContext });
            if (rawInst) {
                const instData = JSON.parse(rawInst);
                if (instData && instData.oobeCompleted === false) {
                    isOobeNeeded = true;
                }
            }
        } catch (e) {
            isOobeNeeded = false;
        }

        if (isOobeNeeded) {
            this.applyHostTheme();
            EventBus.emit('kernel:oobe', { severity: 'Info', source: 'BootOrchestrator', message: 'Installation detected. Initializing OOBE environment...' });

            const oobeEnv = new OobePlatformEnvironment(this.registry, 'oobeName');
            await this.transitionTo(oobeEnv);
            EventBus.emit('platform.ready', { source: 'BootOrchestrator', message: 'OOBE Environment Ready' });
            return;
        }

        // 3. Launch Authentication Environment
        this.applyHostTheme();
        EventBus.emit('kernel:login', { severity: 'Info', source: 'BootOrchestrator', message: 'Launching Authentication Environment.' });
        
        const loginEnv = new LoginPlatformEnvironment(this.registry);
        await this.transitionTo(loginEnv);
        EventBus.emit('kernel:boot', { severity: 'Info', source: 'BootOrchestrator', message: 'Platform Environment: Login' });
        EventBus.emit('platform.ready', { source: 'BootOrchestrator', message: 'Login Environment Ready' });
    }
}
