import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * ClipboardManager
 * 
 * Responsibility:
 * Manages minimal clipboard state.
 */
export class ClipboardManager {
    constructor() {
        this.text = null;
    }

    setText(text) {
        this.text = text;
        EventBus.emit('clipboard.changed', { severity: 'Info', source: 'ClipboardManager', message: 'Clipboard text updated.' });
    }

    getText() {
        return this.text;
    }

    clear() {
        this.text = null;
        EventBus.emit('clipboard.cleared', { severity: 'Info', source: 'ClipboardManager', message: 'Clipboard cleared.' });
    }
}
