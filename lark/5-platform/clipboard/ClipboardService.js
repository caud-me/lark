import { EventBus } from '../../1-kernel/SystemEventBus.js';

/**
 * ClipboardService
 * 
 * Responsibility:
 * Exposes a clean API for reading and writing to the system clipboard.
 */
export class ClipboardService {
    constructor(clipboardManager, registry) {
        this.clipboardManager = clipboardManager;
        this.registry = registry;

        // Synchronize browser native copy events with LDE session clipboard
        document.addEventListener('copy', () => {
            const selectedText = window.getSelection().toString();
            if (selectedText) {
                this.copyText(selectedText);
            }
        });
    }

    _getCurrentSessionId() {
        if (!this.registry) return null;
        const sessionService = this.registry.get('SessionService');
        if (!sessionService) return null;
        const session = sessionService.getCurrentSession();
        return session ? session.id : null;
    }

    /**
     * Copies text to the clipboard.
     * @param {string} text 
     */
    copyText(text) {
        this.clipboardManager.setText(this._getCurrentSessionId(), text);
    }

    /**
     * Reads text from the clipboard.
     * @returns {string|null}
     */
    readText() {
        return this.clipboardManager.getText(this._getCurrentSessionId());
    }

    /**
     * Clears the clipboard.
     */
    clear() {
        this.clipboardManager.clear(this._getCurrentSessionId());
    }

    /**
     * Subscribes to clipboard events for the current session.
     * @param {Function} callback 
     * @returns {Function} Unsubscribe function
     */
    onChange(callback) {
        const handler = (payload) => {
            const { sessionId } = payload.data || {};
            if (sessionId === this._getCurrentSessionId()) {
                const eventType = payload.source === 'ClipboardManager' && payload.message === 'Clipboard cleared.' ? 'cleared' : 'changed';
                callback({ type: eventType });
            }
        };

        EventBus.on('clipboard.changed', handler);
        EventBus.on('clipboard.cleared', handler);

        return () => {
            EventBus.off('clipboard.changed', handler);
            EventBus.off('clipboard.cleared', handler);
        };
    }
}
