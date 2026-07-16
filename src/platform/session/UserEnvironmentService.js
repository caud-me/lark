import { EventBus } from '../../kernel/SystemEventBus.js';
import { LogCategory } from '../../system/LogCategory.js';
import { LogSeverity } from '../../system/LogSeverity.js';

/**
 * UserEnvironmentService
 * 
 * Responsibility:
 * Orchestrates the restoration of a user's operating environment 
 * upon login or session switch.
 */
export class UserEnvironmentService {
    constructor(serviceRegistry) {
        this.serviceRegistry = serviceRegistry;
        this.restoredUsers = new Set();
        
        EventBus.on('session.activated', this._onSessionActivated.bind(this));
        EventBus.on('session.suspended', () => this.restoredUsers.clear());
        EventBus.on('session.ended', () => this.restoredUsers.clear());
    }

    isEnvironmentRestored(username) {
        return this.restoredUsers.has(username);
    }

    async _onSessionActivated() {
        const sessionService = this.serviceRegistry.get('SessionService');
        if (!sessionService) return;
        
        const currentSession = sessionService.getCurrentSession();
        if (!currentSession || currentSession.id === 'sess_system') return;

        EventBus.emit('session.lifecycle', { category: LogCategory.SESSION, severity: LogSeverity.SUCCESS, message: `Activating user "${currentSession.user.username}"`, source: 'UserEnvironmentService' });

        await this.restoreEnvironment(currentSession.user.username);
    }

    async restoreEnvironment(username) {
        EventBus.emit('environment.lifecycle', { category: LogCategory.ENVIRONMENT, severity: LogSeverity.INFO, message: 'Restoring user environment...', source: 'UserEnvironmentService' });

        EventBus.emit('environment.restoring', { 
            severity: 'Info', 
            source: 'UserEnvironmentService', 
            message: `Restoring environment for ${username}` 
        });

        // Check if user profile is initialized
        const userService = this.serviceRegistry.get('UserService');
        const user = userService ? userService.getUser(username) : null;
        const isInitialized = user ? user.profileInitialized : false;

        if (!isInitialized) {
            try {
                const bootService = this.serviceRegistry.get('BootService');
                if (bootService) {
                    const { WelcomePlatformEnvironment } = await import('../boot/BootService.js');
                    const welcomeEnv = new WelcomePlatformEnvironment(this.serviceRegistry, username);
                    // This blocks until the welcome wizard resolves
                    await bootService.transitionTo(welcomeEnv, { destroyCurrent: false });
                }
            } catch (welcomeError) {
                console.error('[UserEnvironmentService] Welcome Environment execution failed:', welcomeError);
            }
        }

        // Dynamically invoke restore() on all registered services that support it
        const services = this.serviceRegistry.getAll();
        for (const [name, service] of services.entries()) {
            if (typeof service.restore === 'function') {
                try {
                    await service.restore(username);
                } catch (e) {
                    console.error(`[UserEnvironmentService] Failed to restore ${name}:`, e);
                }
            }
        }

        this.restoredUsers.add(username);
        EventBus.emit('environment.lifecycle', { category: LogCategory.ENVIRONMENT, severity: LogSeverity.SUCCESS, message: 'User environment restored.', source: 'UserEnvironmentService' });

        EventBus.emit('environment.restored', { 
            severity: 'Info', 
            source: 'UserEnvironmentService', 
            message: `Environment restored for ${username}`,
            username
        });
    }
}
