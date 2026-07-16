import { EventBus } from '../../kernel/SystemEventBus.js';
import { ServiceRegistry } from '../../kernel/ServiceRegistry.js';
import { showFilePickerDialog } from './FilePickerDialog.js';

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
    prompt(message, defaultValue = '', title = 'Input Required', inputType = 'text') {
        return new Promise(resolve => {
            this.dialogManager.showDialog({
                type: 'prompt',
                modal: true,
                title,
                message,
                defaultValue,
                inputType
            }, resolve);
        });
    }

    /**
     * Shows a generic dialog.
     * @param {Object} dialogConfig - { title, message, contentElement, buttons, modal, type }
     * @returns {Promise<any>} Resolves with the result of the clicked button
     */
    show(dialogConfig) {
        return new Promise(resolve => {
            this.dialogManager.showDialog(dialogConfig, resolve);
        });
    }

    /**
     * Opens the system File Picker to select a file for reading.
     * @param {Object} options - { title, initialPath, extensions }
     * @returns {Promise<{path: string}|null>}
     */
    async openFile(options = {}) {
        const fileService = ServiceRegistry.get('FileService');
        if (!fileService) throw new Error('[DialogService] FileService is unavailable.');
        return showFilePickerDialog(this, fileService, { ...options, mode: 'open' });
    }

    /**
     * Opens the system File Picker to select a destination for saving.
     * @param {Object} options - { title, initialPath, extensions, defaultName }
     * @returns {Promise<{path: string}|null>}
     */
    async saveFile(options = {}) {
        const fileService = ServiceRegistry.get('FileService');
        if (!fileService) throw new Error('[DialogService] FileService is unavailable.');
        return showFilePickerDialog(this, fileService, { ...options, mode: 'save' });
    }
}
