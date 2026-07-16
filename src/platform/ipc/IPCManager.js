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
    constructor() {
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

    send(sourcePid, targetPid, message) {
        if (typeof targetPid !== 'number') {
            throw new Error(`IPC Error: Target must be a resolved PID number.`);
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
                        EventBus.emit('ipc:error', { severity: 'Error', source: 'IPCManager', message: `IPC Handler Error: ${e.message}` });
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
                    EventBus.emit('ipc:error', { severity: 'Error', source: 'IPCManager', message: `IPC Broadcast Handler Error: ${e.message}` });
                }
            }
        }
        return deliveredCount;
    }
}
