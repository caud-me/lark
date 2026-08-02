/**
 * GuardianHistoryManager
 *
 * Responsibility:
 * Pure in-memory state owner for Guardian scan history and statistics.
 *
 * Does NOT:
 * - Access FileService or perform disk I/O directly (Service layer handles persistence)
 */
export class GuardianHistoryManager {
    constructor() {
        this.history = [];
        this.maxRetention = 50;
    }

    /**
     * Replaces in-memory scan history state.
     * @param {Array} historyArray 
     */
    setHistory(historyArray) {
        if (Array.isArray(historyArray)) {
            this.history = [...historyArray];
            this._sortAndTrim();
        }
    }

    /**
     * Adds a new scan result record.
     * @param {Object} scanRecord 
     */
    addScanRecord(scanRecord) {
        if (scanRecord) {
            this.history.unshift(scanRecord);
            this._sortAndTrim();
        }
    }

    /**
     * Gets all scan history records.
     * @returns {Array}
     */
    getHistory() {
        return [...this.history];
    }

    /**
     * Gets the latest scan record.
     * @returns {Object|null}
     */
    getLatestScan() {
        if (this.history.length > 0) {
            return this.history[0];
        }
        return null;
    }

    _sortAndTrim() {
        this.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (this.history.length > this.maxRetention) {
            this.history = this.history.slice(0, this.maxRetention);
        }
    }
}
