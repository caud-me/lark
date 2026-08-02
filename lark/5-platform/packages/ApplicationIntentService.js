import { EventBus } from '../../1-kernel/SystemEventBus.js';
import { ScopedServiceRegistry } from '../registry/ScopedServiceRegistry.js';

/**
 * ApplicationIntentService
 *
 * Responsibility:
 * Routes intents between applications, decides whether to deliver to a running 
 * instance or launch a new one, and passes intents as launch arguments.
 * It is an application router.
 *
 * Does NOT:
 * - Execute command logic directly
 * - Resolve which application should handle a file (that is AssociationService)
 */
export class ApplicationIntentService {
    constructor(registry) {
        this.registry = registry;
    }

    /**
     * Delivers an intent to a specific process ID.
     * @param {number} pid 
     * @param {Object} intent - e.g. { type: 'file.open', payload: { path: '/docs/readme.md' } }
     */
    async sendIntent(pid, intent) {
        if (!pid) {
            EventBus.emit('applicationIntentService:error', { severity: 'Error', source: 'ApplicationIntentService', message: `Cannot send intent: missing target PID.` });
            return;
        }

        EventBus.emit('applicationIntentService:dispatch', { 
            severity: 'Info', 
            source: 'ApplicationIntentService', 
            message: `Delivering intent '${intent.type || intent.action}' to PID ${pid}` 
        });

        const processService = this.registry.get('ProcessService');
        if (!processService) return;

        const proc = processService.getProcess(pid);
        if (!proc) return;

        if (proc.instance && typeof proc.instance.handleIntent === 'function') {
            await proc.instance.handleIntent(intent);
            return;
        }

        const appInfo = processService.applicationService.getApplication(proc.appId);
        if (!appInfo) return;

        try {
            const module = await processService.runtimeLoaderService.loadApplication(appInfo);
            const scopedRegistry = new ScopedServiceRegistry(this.registry, pid, {});
            if (module.default && typeof module.default.onIntent === 'function') {
                await module.default.onIntent(scopedRegistry, intent);
            }
        } catch (e) {
            EventBus.emit('applicationIntentService:error', { severity: 'Error', source: 'ApplicationIntentService', message: `Failed to deliver intent to PID ${pid}: ${e.message}` });
            throw e;
        }
    }

    /**
     * Launches an application with an intent, or delivers it to an existing singleton instance.
     * @param {string} appId 
     * @param {Object} intent 
     * @param {Object} options 
     */
    async launchWithIntent(appId, intent, options = {}) {
        const processService = this.registry.get('ProcessService');
        if (!processService) {
            throw new Error('ProcessService not found');
        }

        const appInfo = processService.applicationService.getApplication(appId);
        if (!appInfo) {
            throw new Error(`Cannot start process: App ${appId} not found.`);
        }

        // Singleton routing logic
        if (appInfo.singleton) {
            const existingProc = processService.getProcesses().find(p => p.appId === appId);
            if (existingProc) {
                const windowService = this.registry.get('WindowService');
                const ownWindows = windowService ? windowService.getOwnWindows(existingProc.pid) : [];
                if (ownWindows && ownWindows.length > 0) {
                    windowService.restoreWindowByPid(existingProc.pid);
                    windowService.focusWindowByPid(existingProc.pid);
                    await this.sendIntent(existingProc.pid, intent);
                    return existingProc.pid;
                } else {
                    // Zombie process with 0 windows — terminate it
                    try {
                        processService.terminateProcess(existingProc.pid);
                    } catch (e) {
                        console.warn('[ApplicationIntentService] Zombie process termination note:', e.message);
                    }
                }
            }
        }

        // Launch a new process and pass the intent in the options
        return await processService.startProcess(appId, { ...options, intent });
    }
}
