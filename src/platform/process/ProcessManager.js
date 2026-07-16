import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * ProcessManager
 *
 * Responsibility:
 * Owns the state of running processes (PID mapping, process details).
 *
 * Does NOT:
 * - Enforce process protection policies
 * - Spawn application code execution directly
 */
export class ProcessManager {
    constructor() {
        this.processes = new Map();
        this.nextPid = 1;
    }

    /**
     * Spawns a new process record.
     * @param {string} appId - Application ID
     * @param {string} name - Name of the application
     * @param {string} ownerUsername - Session owner username
     * @param {object} options - Process options (e.g. background, parentPid)
     * @returns {number} The new Process ID (PID)
     */
    startProcess(appId, name, ownerUsername, options = {}) {
        const pid = this.nextPid++;
        const process = {
            pid,
            appId,
            name,
            ownerUsername,
            securityContext: options.securityContext || { role: 'USER', elevated: false, source: 'unknown' },
            state: 'RUNNING',
            startTime: new Date().toISOString(),
            windowCount: 0,
            background: options.background || false,
            parentPid: options.parentPid || null,
            sessionId: options.sessionId || null,
            desktopEnvironmentId: options.desktopEnvironmentId || null
        };
        this.processes.set(pid, process);
        
        EventBus.emit('process.started', { severity: 'Info', source: 'ProcessManager', message: `Process Started: ${name} (PID: ${pid})`, data: { pid, process } });
        return pid;
    }

    /**
     * Updates the window count for a process.
     * @param {number} pid 
     * @param {number} count 
     */
    setWindowCount(pid, count) {
        const proc = this.processes.get(pid);
        if (proc) {
            proc.windowCount = count;
        }
    }

    /**
     * Kills a process by PID.
     * @param {number} pid 
     * @param {boolean} force - Internal flag to bypass protection 
     */
    terminateProcess(pid, force = false) {
        const proc = this.processes.get(pid);
        if (!proc) return;

        // Protection policies are now enforced by ProcessService via ProcessPolicy

        proc.state = 'TERMINATED';
        this.processes.delete(pid);
        EventBus.emit('process.terminated', { severity: 'Info', source: 'ProcessManager', message: `Process Terminated: ${proc.name} (PID: ${pid})`, data: { pid } });
    }

    /**
     * Retrieves a specific process.
     * @param {number} pid 
     * @returns {Object|null}
     */
    getProcess(pid) {
        return this.processes.get(pid) || null;
    }

    /**
     * Retrieves the list of running processes.
     * @returns {Array} List of process objects
     */
    list() {
        return Array.from(this.processes.values());
    }
}
