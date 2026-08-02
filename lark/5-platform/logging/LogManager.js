/**
 * LogManager
 *
 * Responsibility:
 * Stores and manages system logs in memory.
 *
 * Does NOT:
 * - Render logs to the UI
 */
export class LogManager {
    constructor() {
        this.logs = [];
    }

    /**
     * Store a log entry.
     * @param {Object} entry 
     */
    addLog(entry) {
        this.logs.push(entry);
    }

    /**
     * Retrieve all logs.
     * @returns {Array}
     */
    getLogs() {
        return this.logs;
    }

    /**
     * Clear all logs.
     */
    clearLogs() {
        this.logs = [];
    }
}
