import { EventBus } from '../../1-kernel/SystemEventBus.js';

/**
 * StartupApplicationOrchestrator
 *
 * Responsibility:
 * Orchestrates launching user startup apps upon receiving the 'desktop.ready' event hook.
 * Decouples the presentation shell from application startup behavior.
 */
export class StartupApplicationOrchestrator {
    constructor(serviceRegistry) {
        this.registry = serviceRegistry;
        this.startedSessions = new Set();

        EventBus.on('desktop.ready', this._onDesktopReady.bind(this));
        
        EventBus.on('session.ended', (payload) => {
            const sessionId = payload.data?.sessionId;
            if (sessionId) {
                this.startedSessions.delete(sessionId);
            }
        });
    }

    /**
     * Checks if a specific application is authorized to start automatically.
     * Uses Default Allow logic.
     * @param {string} appId
     * @returns {boolean}
     */
    isStartupEnabled(appId) {
        const userSettingsService = this.registry.get('UserSettingsService');
        const prefs = userSettingsService.getSetting('startupApplications');
        if (prefs && prefs[appId] === false) {
            return false;
        }
        return true;
    }

    /**
     * Sets the user's startup preference for an application.
     * @param {string} appId 
     * @param {boolean} isEnabled 
     */
    async setStartupEnabled(appId, isEnabled) {
        const userSettingsService = this.registry.get('UserSettingsService');
        const rawPrefs = userSettingsService.getSetting('startupApplications');
        const prefs = rawPrefs ? { ...rawPrefs } : {};
        prefs[appId] = isEnabled;
        
        await userSettingsService.setSetting('startupApplications', prefs);
        
        EventBus.emit('startup.preference.changed', {
            source: 'StartupApplicationOrchestrator',
            appId,
            isEnabled
        });
    }

    /**
     * Returns a list of applications that have a startup intent, decorated with user preference.
     * @returns {Array} List of decorated startup apps
     */
    getStartupApplications() {
        const applicationService = this.registry.get('ApplicationService');
        if (!applicationService) return [];

        const capableApps = applicationService.getStartupApplications();
        
        return capableApps.map(app => {
            let reason = "Starts automatically.";
            if (app.runtime && app.runtime.startup && typeof app.runtime.startup.reason === 'string') {
                reason = app.runtime.startup.reason;
            }

            return {
                id: app.id,
                title: app.title || app.id,
                icon: app.icon || '&#xE71D;',
                reason: reason,
                isEnabled: this.isStartupEnabled(app.id)
            };
        });
    }

    _onDesktopReady(payload) {
        const { sessionId } = payload.data || {};
        if (!sessionId || this.startedSessions.has(sessionId)) return;

        this.startedSessions.add(sessionId);

        const processService = this.registry.get('ProcessService');
        const recoveryService = this.registry.get('RecoveryService');
        const applicationService = this.registry.get('ApplicationService');

        if (applicationService && processService) {
            const safeMode = recoveryService ? recoveryService.isSafeMode() : false;
            
            // Get base applications with intent from ApplicationService (not the decorated list, to keep raw metadata if needed, 
            // but we can just use the intent list)
            const startupApps = applicationService.getStartupApplications();
            
            startupApps.forEach(app => {
                if (safeMode && app.type !== 'system') return;
                
                if (this.isStartupEnabled(app.id)) {
                    processService.startProcess(app.id, { 
                        sessionId,
                        parentPid: null, 
                        background: app.background || false 
                    });
                }
            });
        }
    }
}
