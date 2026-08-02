/**
 * DialogManager
 * 
 * Responsibility:
 * Owns the mutable runtime queue and active state of OS dialogs.
 * 
 * Does NOT:
 * - Render DOM elements or inject CSS styles (handled by DialogSurface)
 * - Handle business logic, promise resolution, or event emission (handled by DialogService)
 */
export class DialogManager {
    constructor() {
        this.activeDialog = null;
        this.queue = [];
        this.nextId = 1;
    }

    /**
     * Enqueues or activates a new dialog configuration.
     * @param {Object} dialogConfig 
     * @param {Function} resolve 
     */
    showDialog(dialogConfig, resolve) {
        const dialogRecord = {
            id: `dialog-${this.nextId++}`,
            dialogConfig,
            resolve
        };

        if (!this.activeDialog) {
            this.activeDialog = dialogRecord;
        } else {
            this.queue.push(dialogRecord);
        }
    }

    /**
     * Dismisses the current active dialog and promotes the next dialog in queue if available.
     * @returns {Object|null} The dismissed dialog record
     */
    dismissDialog() {
        const previous = this.activeDialog;
        if (this.queue.length > 0) {
            this.activeDialog = this.queue.shift();
        } else {
            this.activeDialog = null;
        }
        return previous;
    }

    /**
     * Returns an immutable snapshot of the active dialog state.
     * @returns {Object|null}
     */
    getActiveDialog() {
        if (!this.activeDialog) return null;
        return {
            id: this.activeDialog.id,
            queueCount: this.queue.length,
            config: { ...this.activeDialog.dialogConfig }
        };
    }
}
