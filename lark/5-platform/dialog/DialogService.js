import { EventBus } from '../../1-kernel/SystemEventBus.js';
import { ServiceRegistry } from '../../1-kernel/ServiceRegistry.js';
import { showFilePickerDialog } from './FilePickerDialog.js';

/**
 * DialogService
 * 
 * STABLE PUBLIC PLATFORM API (LDE 27.7.9)
 * 
 * Responsibility:
 * Exposes a clean, promise-based API for showing alerts, confirmations, prompts, and file pickers.
 * Emits strictly owned `dialog.changed` semantic events for Shell Surface rendering.
 * 
 * Does NOT:
 * - Directly manipulate the DOM (handled by DialogSurface)
 * - Own runtime state queue directly (handled by DialogManager)
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
        return this.show({
            type: 'alert',
            modal: true,
            title,
            message
        });
    }

    /**
     * Shows a modal confirmation dialog.
     * @param {string} message 
     * @param {string} title 
     * @returns {Promise<boolean>} True if OK, False if Cancel
     */
    confirm(message, title = 'Confirm') {
        return this.show({
            type: 'confirm',
            modal: true,
            title,
            message
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
        return this.show({
            type: 'prompt',
            modal: true,
            title,
            message,
            defaultValue,
            inputType
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
            EventBus.emit('dialog.changed');
        });
    }

    /**
     * Dismisses the current active dialog with a result value.
     * @param {any} result 
     */
    dismissDialog(result = null) {
        const previousRecord = this.dialogManager.dismissDialog();
        if (previousRecord && typeof previousRecord.resolve === 'function') {
            previousRecord.resolve(result);
        }
        EventBus.emit('dialog.changed');
    }

    /**
     * Retrieves an immutable snapshot of the active dialog state.
     * @returns {Object|null}
     */
    getActiveDialog() {
        return this.dialogManager.getActiveDialog();
    }

    /**
     * Semantic event subscription method for dialog state changes.
     * @param {Function} callback 
     * @returns {Function} Unsubscribe function
     */
    onDialogChanged(callback) {
        EventBus.on('dialog.changed', callback);
        return () => {
            EventBus.off('dialog.changed', callback);
        };
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

    /**
     * Opens the system File Picker to select a directory.
     * @param {Object} options - { title, initialPath }
     * @returns {Promise<{path: string}|null>}
     */
    async openDirectory(options = {}) {
        const fileService = ServiceRegistry.get('FileService');
        if (!fileService) throw new Error('[DialogService] FileService is unavailable.');
        // console.log('[Diagnostic] DialogService.openDirectory - Options received:', options);
        return showFilePickerDialog(this, fileService, { ...options, mode: 'directory' });
    }
}
