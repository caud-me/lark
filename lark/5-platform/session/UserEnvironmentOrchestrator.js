import { EventBus } from '../../1-kernel/SystemEventBus.js';
import { LogCategory } from '../../3-system/LogCategory.js';
import { LogSeverity } from '../../3-system/LogSeverity.js';

/**
 * UserEnvironmentOrchestrator
 * 
 * Responsibility:
 * Orchestrates the restoration of a user's operating environment 
 * upon login or session switch.
 */
export class UserEnvironmentOrchestrator {
    constructor(serviceRegistry) {
        this.serviceRegistry = serviceRegistry;
        this.restoredUsers = new Set();
        
        EventBus.on('session.activated', this._onSessionActivated.bind(this));
        EventBus.on('session.suspended', () => this.restoredUsers.clear());
        EventBus.on('session.ended', () => this.restoredUsers.clear());
        EventBus.on('workspace.stateChanged', this._onWorkspaceStateChanged.bind(this));
    }

    isEnvironmentRestored(username) {
        return this.restoredUsers.has(username);
    }

    async _onWorkspaceStateChanged() {
        const workspaceService = this.serviceRegistry.get('WorkspaceService');
        const userSettingsService = this.serviceRegistry.get('UserSettingsService');
        
        if (workspaceService && userSettingsService) {
            const state = workspaceService.serializeState();
            await userSettingsService.setSetting('workspaces', state);
        }
    }

    async _onSessionActivated() {
        const sessionService = this.serviceRegistry.get('SessionService');
        if (!sessionService) return;
        
        const currentSession = sessionService.getCurrentSession();
        if (!currentSession || currentSession.id === 'sess_system') return;

        EventBus.emit('session.lifecycle', { category: LogCategory.SESSION, severity: LogSeverity.SUCCESS, message: `Activating user "${currentSession.user.username}"`, source: 'UserEnvironmentOrchestrator' });

        await this.restoreEnvironment(currentSession.user.username);
    }

    async restoreEnvironment(username) {
        EventBus.emit('environment.lifecycle', { category: LogCategory.ENVIRONMENT, severity: LogSeverity.INFO, message: 'Restoring user environment...', source: 'UserEnvironmentOrchestrator' });

        EventBus.emit('environment.restoring', { 
            severity: 'Info', 
            source: 'UserEnvironmentOrchestrator', 
            message: `Restoring environment for ${username}` 
        });

        // Mark user profile as initialized if needed
        const userService = this.serviceRegistry.get('UserService');
        const user = userService ? userService.getUser(username) : null;
        if (user && !user.profileInitialized) {
            user.profileInitialized = true;
        }

        // Dynamically invoke restore() on all registered services that support it
        const services = this.serviceRegistry.getAll();
        for (const [name, service] of services.entries()) {
            if (typeof service.restore === 'function') {
                try {
                    await service.restore(username);
                } catch (e) {
                    console.error(`[UserEnvironmentOrchestrator] Failed to restore ${name}:`, e);
                }
            }
        }

        this.restoredUsers.add(username);
        EventBus.emit('environment.lifecycle', { category: LogCategory.ENVIRONMENT, severity: LogSeverity.SUCCESS, message: 'User environment restored.', source: 'UserEnvironmentOrchestrator' });

        const userSettingsService = this.serviceRegistry.get('UserSettingsService');
        const workspaceService = this.serviceRegistry.get('WorkspaceService');
        if (userSettingsService && workspaceService) {
            const savedState = userSettingsService.getSetting('workspaces');
            if (savedState) {
                workspaceService.restoreState(savedState);
            } else {
                workspaceService.reset();
            }
        }

        const settingsService = this.serviceRegistry.get('SettingsService');
        const desktopEnvironmentId = settingsService ? (settingsService.getSetting('dev.desktopEnvironment') || 'lde') : 'lde';

        EventBus.emit('environment.restored', { 
            severity: 'Info', 
            source: 'UserEnvironmentOrchestrator', 
            message: `Environment restored for ${username}`,
            username,
            desktopEnvironmentId
        });

        // Delay window session state restoration until after shell surfaces mount
        setTimeout(async () => {
            const windowService = this.serviceRegistry.get('WindowService');
            if (userSettingsService && windowService) {
                const savedWindowSession = userSettingsService.getSetting('windowSession');
                if (savedWindowSession) {
                    windowService.restoreSessionState(savedWindowSession);
                }
            }
        }, 150);
    }
}
