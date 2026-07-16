/**
 * RestoreManager
 * 
 * Responsibility:
 * Owns the mutable runtime state for restore operations.
 * Does NOT persist snapshot state (DiskService handles that).
 */
export class RestoreManager {
    constructor() {
        this.activeRestoreOperation = null;
        this.selectedSnapshotId = null;
        this.restoreHistory = []; // runtime only
        this.progress = 0;
    }

    getActiveRestoreOperation() {
        return this.activeRestoreOperation;
    }

    setActiveRestoreOperation(operation) {
        this.activeRestoreOperation = operation;
    }

    getSelectedSnapshotId() {
        return this.selectedSnapshotId;
    }

    setSelectedSnapshotId(id) {
        this.selectedSnapshotId = id;
    }

    getProgress() {
        return this.progress;
    }

    setProgress(progress) {
        this.progress = progress;
    }

    addRestoreHistoryEntry(entry) {
        this.restoreHistory.push(entry);
    }

    getRestoreHistory() {
        return this.restoreHistory;
    }
}
