import { EventBus } from '../kernel/SystemEventBus.js';
import { ProcessPolicy } from '../policies/ProcessPolicy.js';

/**
 * ProcessService
 *
 * Responsibility:
 * Orchestrates process lifecycles (start/terminate) and enforces process policies.
 *
 * Does NOT:
 * - Maintain raw process state
 */
export class ProcessService {
    constructor(processManager, appService, serviceRegistry) {
        this.processManager = processManager;
        this.appService = appService;
        this.serviceRegistry = serviceRegistry;

        // Coordinate updates for window counts
        EventBus.on('windowManager:create', (payload) => {
            if (payload.data && payload.data.pid) {
                const proc = this.getProcess(payload.data.pid);
                if (proc) {
                    this.processManager.setWindowCount(proc.pid, (proc.windowCount || 0) + 1);
                }
            }
        });

        EventBus.on('windowManager:close', (payload) => {
            if (payload.data && payload.data.pid) {
                const proc = this.getProcess(payload.data.pid);
                if (proc) {
                    const newCount = Math.max(0, (proc.windowCount || 0) - 1);
                    this.processManager.setWindowCount(proc.pid, newCount);
                    if (newCount === 0 && !proc.background) {
                        try {
                            this.terminateProcess(proc.pid);
                        } catch (e) {
                            // system process protected from termination
                        }
                    }
                }
            }
        });
    }

    /**
     * Starts a new process from an app ID.
     * @param {string} appId 
     * @param {object} options 
     * @returns {Promise<number|null>} PID
     */
    async startProcess(appId, options = {}) {
        const appInfo = this.appService.getAppById(appId);
        if (!appInfo) {
            EventBus.emit('processService:error', { severity: 'Error', source: 'ProcessService', message: `App ${appId} not found in ServiceRegistry.` });
            return null;
        }

        const sessionService = this.serviceRegistry.get('SessionService');
        const session = sessionService ? sessionService.getCurrentSession() : null;
        const ownerUsername = session ? session.user.username : 'system';

        const processOptions = {
            background: options.background !== undefined ? options.background : (appInfo.background || false),
            parentPid: options.parentPid || null
        };

        const pid = this.processManager.startProcess(appId, appInfo.name, ownerUsername, processOptions);
        EventBus.emit('processService:start', { severity: 'Info', source: 'ProcessService', message: `Started process ${pid} (${appId})` });
        try {
            const module = await import(appInfo.entryPoint);
            if (module.default && typeof module.default.run === 'function') {
                // Do not await run so the app can live in the background
                module.default.run(this.serviceRegistry, pid).catch(e => {
                    EventBus.emit('processService:error', { severity: 'Error', source: 'ProcessService', message: `App ${appId} runtime error: ${e.message}` });
                });
            } else {
                EventBus.emit('processService:error', { severity: 'Error', source: 'ProcessService', message: `App ${appId} missing run() export.` });
            }
        } catch (e) {
            EventBus.emit('processService:error', { severity: 'Error', source: 'ProcessService', message: `Failed to load ${appId}: ${e.message}` });
        }
        return pid;
    }

    /**
     * Ends a process (legacy).
     * @param {number} pid 
     */
    endProcess(pid) {
        this.terminateProcess(pid);
    }

    /**
     * Terminates a process.
     * @param {number} pid 
     * @param {boolean} force
     */
    terminateProcess(pid, force = false) {
        const proc = this.processManager.getProcess(pid);
        if (!proc) return;

        const appInfo = this.appService.getAppById(proc.appId);
        if (!force && !ProcessPolicy.canTerminate(appInfo)) {
            EventBus.emit('processService:error', { severity: 'Error', source: 'ProcessService', message: `Access Denied: ${proc.name} is a protected process and cannot be terminated.` });
            throw new Error(`Access Denied: ${proc.name} is a protected process and cannot be terminated.`);
        }

        EventBus.emit('processService:terminate', { severity: 'Info', source: 'ProcessService', message: `Terminating process ${pid}` });
        this.processManager.terminateProcess(pid, force);
    }

    /**
     * Terminates all processes, typically during shutdown.
     */
    shutdownAll() {
        const processes = this.processManager.list();
        for (const proc of processes) {
            this.processManager.terminateProcess(proc.pid, true); // force kill
        }
    }

    /**
     * Gets all running processes.
     * @returns {Array}
     */
    getProcesses() {
        return this.processManager.list();
    }

    /**
     * Gets a specific process.
     * @param {number} pid 
     * @returns {Object|null}
     */
    getProcess(pid) {
        return this.processManager.getProcess(pid);
    }
}
