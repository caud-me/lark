import { EventBus } from '../../kernel/SystemEventBus.js';
import { BootMode } from '../../system/BootMode.js';
import { EnvironmentType } from '../../system/EnvironmentType.js';

/**
 * PowerService
 *
 * Responsibility:
 * Orchestrates system power and session state transitions (shutdown, lock).
 *
 * Does NOT:
 * - Define policies for when to lock
 *
 * Note: PowerService retrieves SessionService and ProcessService from the
 * registry at call time (rather than storing them at construction) because
 * power actions are infrequent and this avoids holding stale references.
 * SessionService is always registered before PowerService in kernel.js,
 * so the registry lookups are guaranteed to succeed.
 */
export class PowerService {
    constructor(processManager, sessionManager, registry) {
        this.processManager = processManager;
        this.sessionManager = sessionManager;
        this.registry = registry;
    }

    /**
     * Safely invokes a lifecycle method on all registered services.
     * @param {string} methodName 
     */
    async _invokeLifecycle(methodName) {
        const services = this.registry.getAll();
        for (const [name, service] of services.entries()) {
            if (service !== this && typeof service[methodName] === 'function') {
                try {
                    await service[methodName]();
                } catch (e) {
                    console.error(`[PowerService] Error during ${methodName}() for ${name}:`, e);
                }
            }
        }
    }

    /**
     * Terminates all processes owned by the given username.
     * Uses ProcessManager directly (force=true) to bypass protection policies,
     * which is intentional during logout/reboot sequences.
     * @param {string} username 
     */
    _terminateUserProcesses(username) {
        const processes = this.processManager.list();
        for (const proc of processes) {
            if (proc.ownerUsername === username) {
                // Force kill bypassing system protections
                this.processManager.terminateProcess(proc.pid, true);
            }
        }
    }

    /**
     * Locks the current session without terminating it.
     */
    lock() {
        const session = this.sessionManager.getCurrentSession();
        if (!session || session.user.username === 'system') {
            return false;
        }

        EventBus.emit('power:lock', { severity: 'Info', source: 'PowerService', message: `Locking session for ${session.user.username}...` });

        const sessionService = this.registry.get('SessionService');
        if (!sessionService) {
            console.error('[PowerService] SessionService is not available. Cannot lock session.');
            return false;
        }

        return sessionService.lock();
    }

    /**
     * Unlocks the current session without changing process state.
     */
    unlock() {
        const session = this.sessionManager.getCurrentSession();
        if (!session || session.user.username === 'system') {
            return false;
        }

        EventBus.emit('power:unlock', { severity: 'Info', source: 'PowerService', message: `Unlocking session for ${session.user.username}...` });

        const sessionService = this.registry.get('SessionService');
        if (!sessionService) {
            console.error('[PowerService] SessionService is not available. Cannot unlock session.');
            return false;
        }

        return sessionService.unlock();
    }

    /**
     * Logs out the current user, terminates their processes, and returns to login.
     */
    logout() {
        const session = this.sessionManager.getCurrentSession();
        if (!session || session.user.username === 'system') {
            return;
        }

        const username = session.user.username;
        EventBus.emit('power:logout', { severity: 'Info', source: 'PowerService', message: `Logging out user ${username}...` });

        // Terminate user processes first so no new windows can be created
        this._terminateUserProcesses(username);

        // Allow services to save user data
        this._invokeLifecycle('shutdown');

        const sessionService = this.registry.get('SessionService');
        if (!sessionService) {
            console.error('[PowerService] SessionService is not available. Cannot complete logout.');
            return;
        }
        sessionService.logout();
    }

    /**
     * Reboots the system by clearing user state and reloading the browser.
     * @param {Object} options Options for the reboot, including boot mode.
     */
    async reboot(options = { mode: BootMode.NORMAL }) {
        EventBus.emit('power:reboot', { severity: 'Warning', source: 'PowerService', message: `System Rebooting (Mode: ${options.mode})...` });
        
        const session = this.sessionManager.getCurrentSession();
        if (session && session.user.username !== 'system') {
            this._terminateUserProcesses(session.user.username);
            const sessionService = this.registry.get('SessionService');
            if (sessionService) {
                sessionService.logout();
            }
        }
        
        await this._invokeLifecycle('shutdown');
        await this._invokeLifecycle('dispose');

        // Persist the requested boot mode
        localStorage.setItem('lde_boot_mode', options.mode);
        
        // Browser-safe reboot
        window.location.reload();
    }

    async shutdown() {
        const envManager = this.registry.get('EnvironmentManager');
        const activeEnv = envManager ? envManager.getActiveEnvironment() : null;
        if (activeEnv && activeEnv.type === EnvironmentType.SHUTDOWN) {
            return;
        }

        const bootService = this.registry.get('BootService');
        if (bootService) {
            const { ShutdownPlatformEnvironment } = await import('../boot/BootService.js');
            const shutdownEnv = new ShutdownPlatformEnvironment(this.registry);
            await bootService.transitionTo(shutdownEnv);
        }
    }
}
