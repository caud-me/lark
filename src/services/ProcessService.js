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
    /**
     * @param {ProcessManager} processManager 
     * @param {ApplicationService} applicationService 
     * @param {ServiceRegistry} serviceRegistry 
     * @param {RuntimeLoaderService} runtimeLoaderService
     */
    constructor(processManager, applicationService, serviceRegistry, runtimeLoaderService) {
        this.processManager = processManager;
        this.applicationService = applicationService;
        this.serviceRegistry = serviceRegistry;
        this.runtimeLoaderService = runtimeLoaderService;

        // Coordinate updates for window counts
        EventBus.on('window.created', (payload) => {
            if (payload.data && payload.data.pid) {
                const proc = this.getProcess(payload.data.pid);
                if (proc) {
                    this.processManager.setWindowCount(proc.pid, (proc.windowCount || 0) + 1);
                }
            }
        });

        EventBus.on('window.closed', (payload) => {
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
        const appInfo = this.applicationService.getApplication(appId);
        if (!appInfo) {
            throw new Error(`Cannot start process: App ${appId} not found.`);
        }

        if (appInfo.singleton) {
            const existingProc = this.processManager.list().find(p => p.appId === appId);
            if (existingProc) {
                const windowService = this.serviceRegistry.get('WindowService');
                if (windowService) {
                    windowService.restoreWindowByPid(existingProc.pid);
                    windowService.focusWindowByPid(existingProc.pid);
                }

                return existingProc.pid;

                return existingProc.pid;
            }
        }

        const sessionService = this.serviceRegistry.get('SessionService');
        const securityService = this.serviceRegistry.get('SecurityService');
        const sessionContext = securityService ? securityService.getSessionContext() : null;
        const session = sessionService ? sessionService.getCurrentSession() : null;
        const ownerUsername = session ? session.user.username : 'system';

        let targetRole = 'USER';
        let source = 'unknown';

        if (sessionContext) {
            targetRole = sessionContext.role;
            source = sessionContext.source;
        } else {
            targetRole = 'SYSTEM';
            source = 'kernel_fallback';
        }

        if (appInfo.requiredRole && securityService) {
            const securityManager = securityService.securityManager;
            if (securityManager.compareRoles(targetRole, appInfo.requiredRole) < 0) {
                throw new Error(`Cannot start ${appInfo.name}: Requires ${appInfo.requiredRole} privileges.`);
            }
        }

        let elevated = false;
        if (appInfo.requiredRole === 'ADMINISTRATOR' && securityService && securityService.isAdministrator({ role: targetRole })) {
            const dialogService = this.serviceRegistry.get('DialogService');
            if (dialogService) {
                const confirmed = await dialogService.showConfirmation(
                    'Elevation Required',
                    `${appInfo.name} requires Administrator privileges to run. Allow?`
                );
                if (!confirmed) {
                    throw new Error(`Launch cancelled: ${appInfo.name} requires elevation.`);
                }
                elevated = true;
            }
        }

        const securityContext = {
            role: targetRole,
            elevated,
            source,
            identity: ownerUsername
        };

        const processOptions = {
            background: options.background !== undefined ? options.background : (appInfo.background || false),
            parentPid: options.parentPid || null,
            securityContext,
            sessionId: options.sessionId || (session ? session.id : null),
            desktopEnvironmentId: options.desktopEnvironmentId || null
        };

        // ProcessManager.startProcess() already emits 'process.started' with the full process record.
        // We do NOT emit it again here — doing so would cause every subscriber to handle one launch twice.
        const processName = appInfo.title || appInfo.name || appInfo.id;
        const pid = this.processManager.startProcess(appId, processName, ownerUsername, processOptions);
        
        if (elevated && securityService) {
            securityService.elevate(pid);
        }
        try {
            const module = await this.runtimeLoaderService.loadApplication(appInfo);
            if (module.default && typeof module.default.run === 'function') {
                // Do not await run so the app can live in the background
                module.default.run(this.serviceRegistry, pid, options || {}).catch(e => {
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
     * Starts a Desktop Environment as a tracked process, bypassing the application pipeline.
     * @param {Object} desktopEnv - The Desktop Environment provider metadata (e.g. from DesktopEnvironmentRegistry)
     * @param {object} options 
     * @returns {Promise<number|null>} PID
     */
    async startDesktopEnvironment(desktopEnv, options = {}) {
        const sessionService = this.serviceRegistry.get('SessionService');
        const session = sessionService ? sessionService.getCurrentSession() : null;
        const ownerUsername = session ? session.user.username : 'system';

        const securityContext = {
            role: 'USER',
            elevated: false,
            source: 'desktop_orchestrator',
            identity: ownerUsername
        };

        const processOptions = {
            background: true,
            parentPid: null,
            securityContext,
            sessionId: options.sessionId || null,
            desktopEnvironmentId: desktopEnv.id
        };

        const pid = this.processManager.startProcess(desktopEnv.id, desktopEnv.name, ownerUsername, processOptions);

        try {
            // Natively load the desktop entry point
            const url = new URL(desktopEnv.entryPoint.replace(/^\//, ''), window.LDE_BASE_URL).href;
            const module = await import(url);
            if (module.default && typeof module.default.run === 'function') {
                module.default.run(this.serviceRegistry, pid).catch(e => {
                    EventBus.emit('processService:error', { severity: 'Error', source: 'ProcessService', message: `Desktop ${desktopEnv.id} runtime error: ${e.message}` });
                });
            }
        } catch (e) {
            EventBus.emit('processService:error', { severity: 'Error', source: 'ProcessService', message: `Failed to load desktop environment ${desktopEnv.id}: ${e.message}` });
        }

        return pid;
    }

    /**
     * Terminates a process.
     * @param {number} pid 
     * @param {boolean} force
     */
    terminateProcess(pid, force = false) {
        const proc = this.processManager.getProcess(pid);
        if (!proc) return;

        const appInfo = this.applicationService.getApplication(proc.appId);
        if (!force && appInfo && !ProcessPolicy.canTerminate(appInfo)) {
            EventBus.emit('processService:error', { severity: 'Error', source: 'ProcessService', message: `Access Denied: ${proc.name} is a protected process and cannot be terminated.` });
            throw new Error(`Access Denied: ${proc.name} is a protected process and cannot be terminated.`);
        }

        EventBus.emit('process.terminated', { severity: 'Info', source: 'ProcessService', message: `Terminating process ${pid}`, data: { pid } });
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
