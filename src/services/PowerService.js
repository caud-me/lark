import { EventBus } from '../kernel/SystemEventBus.js';

/**
 * PowerService
 *
 * Responsibility:
 * Orchestrates system power and session state transitions (shutdown, lock).
 *
 * Does NOT:
 * - Define policies for when to lock
 */
export class PowerService {
    constructor(processManager, sessionManager, registry) {
        this.processManager = processManager;
        this.sessionManager = sessionManager;
        this.registry = registry;
    }

    /**
     * Terminates all processes owned by the given username.
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

        const SessionService = this.registry.get('SessionService');
        EventBus.emit('power:lock', { severity: 'Info', source: 'PowerService', message: `Locking session for ${session.user.username}...` });
        
        let success = false;
        if (SessionService && typeof SessionService.lock === 'function') {
            success = SessionService.lock();
        } else {
            success = this.sessionManager.lockSession();
        }

        if (success) {
            const ProcessService = this.registry.get('ProcessService');
            if (ProcessService) {
                ProcessService.startProcess('sys.lock');
            }
        }
        return success;
    }

    /**
     * Unlocks the current session without changing process state.
     */
    unlock() {
        const session = this.sessionManager.getCurrentSession();
        if (!session || session.user.username === 'system') {
            return false;
        }

        const SessionService = this.registry.get('SessionService');
        EventBus.emit('power:unlock', { severity: 'Info', source: 'PowerService', message: `Unlocking session for ${session.user.username}...` });
        if (SessionService && typeof SessionService.unlock === 'function') {
            return SessionService.unlock();
        }
        return this.sessionManager.unlockSession();
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

        // Terminate user processes
        this._terminateUserProcesses(username);

        // End session
        const SessionService = this.registry.get('SessionService');
        if (SessionService) {
            SessionService.logout();
        } else {
            this.sessionManager.endSession();
        }

        // Return to login screen
        const ProcessService = this.registry.get('ProcessService');
        if (ProcessService) {
            ProcessService.startProcess('sys.login');
        }
    }

    /**
     * Reboots the system by clearing user state and reloading the browser.
     */
    reboot() {
        EventBus.emit('power:reboot', { severity: 'Warning', source: 'PowerService', message: 'System Rebooting...' });
        
        const session = this.sessionManager.getCurrentSession();
        if (session && session.user.username !== 'system') {
            this._terminateUserProcesses(session.user.username);
            const SessionService = this.registry.get('SessionService');
            if (SessionService) {
                SessionService.logout();
            }
        }
        
        // Browser-safe reboot
        window.location.reload();
    }

    /**
     * Shuts down the system by clearing user state and rendering an inert screen.
     */
    shutdown() {
        EventBus.emit('power:shutdown', { severity: 'Warning', source: 'PowerService', message: 'System Shutting Down...' });
        
        const ProcessService = this.registry.get('ProcessService');
        if (ProcessService) {
            ProcessService.shutdownAll();
            ProcessService.startProcess('sys.shutdown');
        }
    }
}
