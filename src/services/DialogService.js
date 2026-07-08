import { EventBus } from '../kernel/SystemEventBus.js';

/**
 * DialogService
 * 
 * Responsibility:
 * Exposes a clean, promise-based API for showing alerts, confirmations, and prompts.
 * 
 * Does NOT:
 * - Directly manipulate the DOM (handled by DialogManager)
 */
export class DialogService {
    constructor(dialogManager) {
        this.dialogManager = dialogManager;
    }

    /**
     * Shows a modal alert.
     * @param {string} message 
     * @param {string} title 
     * @returns {Promise<boolean>}
     */
    alert(message, title = 'Alert') {
        return new Promise(resolve => {
            this.dialogManager.showDialog({
                type: 'alert',
                modal: true,
                title,
                message
            }, resolve);
        });
    }

    /**
     * Shows a modal confirmation dialog.
     * @param {string} message 
     * @param {string} title 
     * @returns {Promise<boolean>} True if OK, False if Cancel
     */
    confirm(message, title = 'Confirm') {
        return new Promise(resolve => {
            this.dialogManager.showDialog({
                type: 'confirm',
                modal: true,
                title,
                message
            }, resolve);
        });
    }

    /**
     * Shows a modal prompt for input.
     * @param {string} message 
     * @param {string} defaultValue 
     * @param {string} title 
     * @returns {Promise<string|null>} The inputted string, or null if Cancel
     */
    prompt(message, defaultValue = '', title = 'Input Required') {
        return new Promise(resolve => {
            this.dialogManager.showDialog({
                type: 'prompt',
                modal: true,
                title,
                message,
                defaultValue
            }, resolve);
        });
    }
}
