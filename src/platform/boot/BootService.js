import { EventBus } from '../../kernel/SystemEventBus.js';
import { BootMode } from '../../system/BootMode.js';
import { SYSTEM_INFO } from '../../system/SystemVersion.js';
import { ServiceRegistry } from '../../kernel/ServiceRegistry.js';
import { Environment } from '../../system/Environment.js';
import { EnvironmentType } from '../../system/EnvironmentType.js';
import { LogCategory } from '../../system/LogCategory.js';
import { LogSeverity } from '../../system/LogSeverity.js';

import { PlatformEnvironmentRegistry } from '../environments/platform/PlatformEnvironmentRegistry.js';

/**
 * Platform Environment classes are intentionally co-located in this file.
 *
 * Login, Lock, Recovery, OOBE, Welcome, and Shutdown environments are not
 * general-purpose UI environments — they are boot states owned by the boot
 * orchestration sequence. Co-locating them with BootService keeps related
 * lifecycle logic together and avoids scattering small, boot-only classes
 * across the environments directory.
 *
 * See backlog.md entry "Evaluate extraction if BootService exceeds readability targets"
 * for the deferred condition under which this decision should be revisited.
 */

const platformRegistry = new PlatformEnvironmentRegistry();

export class LoginPlatformEnvironment extends Environment {
    constructor(registry) {
        super('login', EnvironmentType.LOGIN, registry);
        this.metadata = platformRegistry.getEnvironment('sys.login');
    }
    async mount() {
        const url = new URL(this.metadata.entryPoint.replace(/^\//, ''), window.LDE_BASE_URL).href;
        const module = await import(url);
        await module.default.run(this.registry);
    }
    async destroy() {
        const container = document.getElementById('login-container');
        if (container) container.remove();
    }
}

export class LockPlatformEnvironment extends Environment {
    constructor(registry) {
        super('lock', EnvironmentType.LOCK, registry);
        this.metadata = platformRegistry.getEnvironment('sys.lock');
    }
    async mount() {
        const url = new URL(this.metadata.entryPoint.replace(/^\//, ''), window.LDE_BASE_URL).href;
        const module = await import(url);
        await module.default.run(this.registry);
    }
    async destroy() {
        const container = document.getElementById('lock-container');
        if (container) container.remove();
    }
}

export class RecoveryPlatformEnvironment extends Environment {
    constructor(registry) {
        super('recovery', EnvironmentType.RECOVERY, registry);
        this.metadata = platformRegistry.getEnvironment('sys.recovery');
    }
    async mount() {
        const url = new URL(this.metadata.entryPoint.replace(/^\//, ''), window.LDE_BASE_URL).href;
        const module = await import(url);
        await module.default.run(this.registry);
    }
    async destroy() {
        const container = document.getElementById('recovery-container');
        if (container) container.remove();
    }
}

export class OobePlatformEnvironment extends Environment {
    constructor(registry) {
        super('oobe', EnvironmentType.BOOT, registry);
        this.metadata = platformRegistry.getEnvironment('sys.oobe');
    }

    async mount() {
        const url = new URL(this.metadata.entryPoint.replace(/^\//, ''), window.LDE_BASE_URL).href;
        const module = await import(url);
        await module.default.run(this.registry);
    }

    async destroy() {
        const container = document.getElementById('oobe-container');
        if (container) container.remove();
    }
}

export class WelcomePlatformEnvironment extends Environment {
    constructor(registry, username) {
        super('welcome', EnvironmentType.WELCOME, registry);
        this.username = username;
        this.metadata = platformRegistry.getEnvironment('sys.welcome');
    }

    async mount() {
        const url = new URL(this.metadata.entryPoint.replace(/^\//, ''), window.LDE_BASE_URL).href;
        const module = await import(url);
        await module.default.run(this.registry, this.username);
    }

    async destroy() {
        const container = document.getElementById('welcome-container');
        if (container) container.remove();
    }
}

export class ShutdownPlatformEnvironment extends Environment {
    constructor(registry) {
        super('shutdown', EnvironmentType.SHUTDOWN, registry);
        this.metadata = platformRegistry.getEnvironment('sys.shutdown');
    }

    async mount() {
        const url = new URL(this.metadata.entryPoint.replace(/^\//, ''), window.LDE_BASE_URL).href;
        const module = await import(url);
        module.default.run(this.registry);
    }

    async destroy() {
        const container = document.getElementById('shutdown-container');
        if (container) container.remove();
    }
}

export class BootService {
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
            EventBus.emit('session.lifecycle', { category: LogCategory.SESSION, severity: LogSeverity.INFO, message: 'User session suspended.', source: 'BootService' });

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
            EventBus.emit('session.lifecycle', { category: LogCategory.SESSION, severity: LogSeverity.INFO, message: 'User session ended.', source: 'BootService' });

            const envManager = this.registry.get('EnvironmentManager');
            const activeEnv = envManager ? envManager.getActiveEnvironment() : null;
            if (activeEnv && activeEnv.type === EnvironmentType.SHUTDOWN) {
                return;
            }

            // Re-mount login screen
            const loginEnv = new LoginPlatformEnvironment(this.registry);
            await this.transitionTo(loginEnv);
        });

        /*
        EventBus.on('session.locked', async (payload) => {
            EventBus.emit('kernel:boot', { severity: 'Info', source: 'BootService', message: 'Session locked.' });
            const lockEnv = new LockPlatformEnvironment(this.registry);
            await this.transitionTo(lockEnv);
        });

        EventBus.on('session.unlocked', async (payload) => {
            EventBus.emit('kernel:boot', { severity: 'Info', source: 'BootService', message: 'Session unlocked.' });
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

            const { username } = payload || {};
            const sessionService = this.registry.get('SessionService');
            const session = sessionService ? sessionService.getCurrentSession() : null;
            if (!session) return;

            const desktopEnvService = this.registry.get('DesktopEnvironmentService');
            if (desktopEnvService) {
                const envId = desktopEnvService.getDefaultEnvironment();
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
            throw new Error('[BootService] Required boot services are missing.');
        }

        const systemContext = { identity: 'system', role: 'SYSTEM' };
        EventBus.emit('kernel:boot', { severity: 'Info', source: 'BootService', message: 'Selecting startup environment...' });

        // 1. Check Boot Mode (Safe / Recovery)
        if (recoveryService && recoveryService.isRecoveryMode()) {
            this.applyHostTheme();
            EventBus.emit('kernel:recovery', { severity: 'Warning', source: 'BootService', message: 'Entering Recovery Mode.' });
            const recoveryEnv = new RecoveryPlatformEnvironment(this.registry);
            EventBus.emit('platform.ready', { source: 'BootService', message: 'Recovery Environment Ready' });
            await this.transitionTo(recoveryEnv);
            return;
        }

        // 2. Check installation state (First Boot Setup)
        const installationPath = '/system/installation.json';
        if (!fileService.exists(installationPath, { context: systemContext })) {
            this.applyHostTheme();
            EventBus.emit('kernel:firstBoot', { severity: 'Info', source: 'BootService', message: 'First boot detected. Initializing base system...' });

            if (!fileService.exists('/system', { context: systemContext })) await fileService.createDirectory('/system', { context: systemContext });
            if (!fileService.exists('/users', { context: systemContext })) await fileService.createDirectory('/users', { context: systemContext });

            if (userService) {
                try {
                    userService.createUser('user', 'User', '', { context: systemContext });
                } catch (e) {
                    console.error('[BootService] Failed to pre-create default administrator:', e);
                }
            }

            EventBus.emit('kernel:boot', { severity: 'Info', source: 'BootService', message: 'Provisioning base system...' });
            const oobeEnv = new OobePlatformEnvironment(this.registry);
            EventBus.emit('platform.ready', { source: 'BootService', message: 'OOBE Environment Ready' });
            await this.transitionTo(oobeEnv);

            try {
                fileService.writeFile(installationPath, JSON.stringify({
                    installed: true,
                    setupCompleted: true,
                    version: SYSTEM_INFO.version,
                    migration: 0
                }), { context: systemContext });
            } catch (e) {
                console.error('[BootService] Failed to write installation metadata:', e);
            }

            EventBus.emit('kernel:oobeComplete', { severity: 'Info', source: 'BootService', message: 'OOBE completed.' });
        }

        // 3. Launch Authentication Environment
        this.applyHostTheme();
        EventBus.emit('kernel:login', { severity: 'Info', source: 'BootService', message: 'Launching Authentication Environment.' });
        
        const loginEnv = new LoginPlatformEnvironment(this.registry);
        await this.transitionTo(loginEnv);
        EventBus.emit('kernel:boot', { severity: 'Info', source: 'BootService', message: 'Platform Environment: Login' });
        EventBus.emit('platform.ready', { source: 'BootService', message: 'Login Environment Ready' });
    }
}
