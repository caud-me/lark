/**
 * ClipboardService
 * 
 * Responsibility:
 * Exposes a clean API for reading and writing to the system clipboard.
 */
export class ClipboardService {
    constructor(clipboardManager) {
        this.clipboardManager = clipboardManager;
    }

    /**
     * Copies text to the clipboard.
     * @param {string} text 
     */
    copyText(text) {
        this.clipboardManager.setText(text);
    }

    /**
     * Reads text from the clipboard.
     * @returns {string|null}
     */
    readText() {
        return this.clipboardManager.getText();
    }

    /**
     * Clears the clipboard.
     */
    clear() {
        this.clipboardManager.clear();
    }
}
