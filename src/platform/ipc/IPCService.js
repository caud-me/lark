import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * IPCService
 *
 * Responsibility:
 * Exposes a public API for applications to send and subscribe to messages.
 *
 * Does NOT:
 * - Store messages permanently
 */
export class IPCService {
    constructor(ipcManager, serviceRegistry) {
        this.ipcManager = ipcManager;
        this.serviceRegistry = serviceRegistry;
        
        // Unsubscribe all automatically when a process terminates
        EventBus.on('process.terminated', (payload) => {
            if (payload.data && payload.data.pid) {
                this.ipcManager.unsubscribeAllForPid(payload.data.pid);
            }
        });
    }

    subscribe(pid, channel, callback) {
        this.ipcManager.subscribe(pid, channel, callback);
    }

    unsubscribe(pid, channel, callback) {
        this.ipcManager.unsubscribe(pid, channel, callback);
    }

    send(sourcePid, target, message) {
        try {
            let targetPid = parseInt(target, 10);
            
            if (isNaN(targetPid)) {
                // Target is an appId. Resolve through ProcessService.
                const processService = this.serviceRegistry.get('ProcessService');
                const procs = processService.listProcesses().filter(p => p.appId === target);
                if (procs.length === 0) {
                    throw new Error(`IPC Error: No running process found for appId '${target}'`);
                }
                if (procs.length > 1) {
                    throw new Error(`IPC Error: Ambiguous target. Multiple running processes for appId '${target}'`);
                }
                targetPid = procs[0].pid;
            }

            const delivered = this.ipcManager.send(sourcePid, targetPid, message);
            EventBus.emit('ipc.sent', { 
                severity: 'Info', 
                source: 'IPCService', 
                message: `IPC Message sent from PID ${sourcePid} to ${target}`, 
                data: { sourcePid, target, message, delivered } 
            });
            return delivered;
        } catch (e) {
            EventBus.emit('ipc.error', { 
                severity: 'Error', 
                source: 'IPCService', 
                message: e.message
            });
            throw e;
        }
    }

    broadcast(sourcePid, channel, message) {
        const deliveredCount = this.ipcManager.broadcast(sourcePid, channel, message);
        EventBus.emit('ipc.broadcast', { 
            severity: 'Info', 
            source: 'IPCService', 
            message: `IPC Broadcast from PID ${sourcePid} on channel ${channel}`, 
            data: { sourcePid, channel, message, deliveredCount } 
        });
        return deliveredCount;
    }
}
