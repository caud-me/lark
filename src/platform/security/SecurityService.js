import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * SecurityService
 *
 * Responsibility:
 * Exposes the public API for security context resolution and privilege checks.
 */
export class SecurityService {
    constructor(securityManager, processManager, sessionManager) {
        this.securityManager = securityManager;
        this.processManager = processManager;
        this.sessionManager = sessionManager;
    }

    /**
     * Resolves the security context for a given process PID.
     * @param {number} pid 
     * @returns {Object|null} { role, elevated, source }
     */
    getContext(pid) {
        if (!pid) return null;
        
        const proc = this.processManager.getProcess(pid);
        if (proc && proc.securityContext) {
            // Include elevation state from manager dynamically
            return {
                ...proc.securityContext,
                elevated: this.securityManager.isElevated(pid)
            };
        }
        return null;
    }

    /**
     * Helper to get the security context of the currently active session.
     * Useful for UI or shell code that isn't running as a managed process.
     * @returns {Object|null}
     */
    getSessionContext() {
        const session = this.sessionManager.getCurrentSession();
        if (!session) return null;

        return {
            role: session.userRole || this.securityManager.roles.USER,
            elevated: false, // Sessions themselves are not elevated, only processes
            source: session.user.username === 'system' ? 'system_session' : 'user_session',
            identity: session.user.username
        };
    }

    getSystemContext() {
        return {
            role: this.securityManager.roles.SYSTEM,
            elevated: false,
            source: 'system',
            identity: 'system'
        };
    }

    isSystem(context) {
        return context && context.role === this.securityManager.roles.SYSTEM;
    }
    
    isKernel(context) {
        return context && context.role === this.securityManager.roles.KERNEL;
    }

    isAdministrator(context) {
        return context && (
            this.securityManager.compareRoles(context.role, this.securityManager.roles.ADMINISTRATOR) >= 0
        );
    }

    canElevate(context) {
        if (!context) return false;
        // Only ADMINISTRATOR role can elevate. USER role cannot.
        // SYSTEM/KERNEL don't need elevation.
        return context.role === this.securityManager.roles.ADMINISTRATOR && !context.elevated;
    }

    elevate(pid) {
        const context = this.getContext(pid);
        if (this.canElevate(context)) {
            this.securityManager.addElevation(pid);
            EventBus.emit('security.elevated', { severity: 'Info', source: 'SecurityService', message: `Process ${pid} elevated privileges.` });
            return true;
        }
        return false;
    }

    dropPrivileges(pid) {
        if (this.securityManager.isElevated(pid)) {
            this.securityManager.removeElevation(pid);
            EventBus.emit('security.dropped', { severity: 'Info', source: 'SecurityService', message: `Process ${pid} dropped elevated privileges.` });
        }
    }
}
