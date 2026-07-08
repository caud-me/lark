/**
 * IPCManager
 *
 * Responsibility:
 * Manages inter-process communication channels and subscriptions.
 *
 * Does NOT:
 * - Authorize or authenticate IPC messages
 */
export class IPCManager {
    constructor(processManager) {
        this.processManager = processManager;
        // Map of channelName -> Set of { pid, callback }
        this.channels = new Map();
    }

    subscribe(pid, channel, callback) {
        if (!this.channels.has(channel)) {
            this.channels.set(channel, new Set());
        }
        this.channels.get(channel).add({ pid, callback });
    }

    unsubscribe(pid, channel, callback) {
        if (this.channels.has(channel)) {
            const subs = this.channels.get(channel);
            for (const sub of subs) {
                if (sub.pid === pid && sub.callback === callback) {
                    subs.delete(sub);
                    break;
                }
            }
        }
    }

    unsubscribeAllForPid(pid) {
        for (const [channel, subs] of this.channels.entries()) {
            for (const sub of subs) {
                if (sub.pid === pid) {
                    subs.delete(sub);
                }
            }
        }
    }

    send(sourcePid, target, message) {
        // Target is either a PID (number/string of number) or an appId (string)
        let targetPid = parseInt(target, 10);
        
        if (isNaN(targetPid)) {
            // Target is an appId. Resolve through ProcessManager.
            const procs = this.processManager.list().filter(p => p.appId === target);
            if (procs.length === 0) {
                throw new Error(`IPC Error: No running process found for appId '${target}'`);
            }
            if (procs.length > 1) {
                throw new Error(`IPC Error: Ambiguous target. Multiple running processes for appId '${target}'`);
            }
            targetPid = procs[0].pid;
        }

        // Deliver to subscriptions that match targetPid. 
        // We will emit it on a reserved channel 'pid:<targetPid>'
        const targetChannel = `pid:${targetPid}`;
        if (this.channels.has(targetChannel)) {
            for (const sub of this.channels.get(targetChannel)) {
                if (sub.pid === targetPid) {
                    try {
                        sub.callback({ sourcePid, message });
                    } catch (e) {
                        console.error(`IPC Handler Error:`, e);
                    }
                }
            }
            return true;
        }
        return false;
    }

    broadcast(sourcePid, channel, message) {
        let deliveredCount = 0;
        if (this.channels.has(channel)) {
            for (const sub of this.channels.get(channel)) {
                try {
                    sub.callback({ sourcePid, channel, message });
                    deliveredCount++;
                } catch (e) {
                    console.error(`IPC Broadcast Handler Error:`, e);
                }
            }
        }
        return deliveredCount;
    }
}
