import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * StartupApplicationService
 *
 * Responsibility:
 * Orchestrates launching user startup apps upon receiving the 'desktop.ready' event hook.
 * Decouples the presentation shell from application startup behavior.
 */
export class StartupApplicationService {
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

    _onDesktopReady(payload) {
        const { sessionId } = payload.data || {};
        if (!sessionId || this.startedSessions.has(sessionId)) return;

        this.startedSessions.add(sessionId);

        const applicationService = this.registry.get('ApplicationService');
        const processService = this.registry.get('ProcessService');
        const recoveryService = this.registry.get('RecoveryService');

        if (applicationService && processService) {
            const safeMode = recoveryService ? recoveryService.isSafeMode() : false;
            const startupApps = applicationService.getStartupApplications();
            
            startupApps.forEach(app => {
                if (safeMode && app.type !== 'system') return;
                
                processService.startProcess(app.id, { 
                    sessionId,
                    parentPid: null, 
                    background: app.background || false 
                });
            });
        }
    }
}
