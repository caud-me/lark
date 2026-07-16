import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * LogService
 *
 * Responsibility:
 * Exposes a public API for writing and reading system logs.
 *
 * Does NOT:
 * - Manage log memory constraints
 */
export class LogService {
    constructor(logManager) {
        this.logManager = logManager;
        this.subscribers = new Set();
        
        // Listen to all system events and convert to structured logs
        EventBus.on('*', (event, envelope) => {
            this.addEntry(envelope);
        });
    }

    /**
     * Internal insertion path for log records regardless of origin.
     * Used by live EventBus events and by the one-time BootLogger handoff.
     */
    addEntry(entry) {
        if (!entry) return;
        this.logManager.addLog(entry);
        this.subscribers.forEach(cb => cb(entry));
    }

    /**
     * Retrieves all logs.
     * @returns {Array}
     */
    getLogs() {
        return this.logManager.getLogs();
    }

    /**
     * Subscribes to live log updates.
     * @param {Function} callback 
     */
    subscribe(callback) {
        this.subscribers.add(callback);
    }

    /**
     * Unsubscribes from live log updates.
     * @param {Function} callback 
     */
    unsubscribe(callback) {
        this.subscribers.delete(callback);
    }

    /**
     * Clears all logs.
     */
    clearLogs() {
        this.logManager.clearLogs();
    }
}
