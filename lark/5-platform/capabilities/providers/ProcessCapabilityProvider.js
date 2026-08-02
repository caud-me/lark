import { CapabilityProvider } from './CapabilityProvider.js';

/**
 * ProcessCapabilityProvider
 *
 * Responsibility:
 * Adapts the internal ProcessService for privileged OS consumption.
 * Validates authority before returning process lists or terminating.
 */
export class ProcessCapabilityProvider extends CapabilityProvider {
    constructor(processService, securityService) {
        super();
        this.processService = processService;
        this.securityService = securityService;
    }

    getName() {
        return 'processes';
    }

    forProcess(pid) {
        const context = this.securityService.getContext(pid);
        return new BoundProcessCapability(this.processService, context);
    }
}

class BoundProcessCapability {
    constructor(processService, context) {
        this.processService = processService;
        this.context = context;
    }

    getProcesses() {
        if (!this._canViewProcesses()) {
            throw new Error("Permission denied: Process enumeration requires privileged capability.");
        }
        
        const processes = this.processService.getProcesses();
        return processes.map(p => ({
            pid: p.pid,
            appId: p.appId,
            name: p.name,
            state: p.state,
            owner: p.ownerUsername,
            // Provide UI-required fields to prevent TaskManager UI formatting errors
            background: p.background,
            startTime: p.startTime,
            sessionId: p.sessionId,
            parentPid: p.parentPid,
            windowCount: p.windowCount
        }));
    }

    terminateProcess(pid) {
        if (!this._canTerminateProcesses()) {
            throw new Error("Permission denied: Process termination requires privileged capability.");
        }
        
        return this.processService.terminateProcess(pid);
    }

    _canViewProcesses() {
        return this.context && (this.context.role === 'ADMINISTRATOR' || this.context.role === 'SYSTEM');
    }

    _canTerminateProcesses() {
        return this.context && (this.context.role === 'ADMINISTRATOR' || this.context.role === 'SYSTEM');
    }
}
