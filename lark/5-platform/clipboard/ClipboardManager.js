import { EventBus } from '../../1-kernel/SystemEventBus.js';

/**
 * ClipboardManager
 * 
 * Responsibility:
 * Manages minimal clipboard state.
 */
export class ClipboardManager {
    constructor() {
        this.clipboards = new Map();

        EventBus.on('session.ended', (payload) => {
            const { sessionId } = payload.data || {};
            if (sessionId) {
                this.clipboards.delete(sessionId);
            }
        });
    }

    setText(sessionId, text) {
        if (!sessionId) return;
        this.clipboards.set(sessionId, text);
        EventBus.emit('clipboard.changed', { severity: 'Info', source: 'ClipboardManager', message: 'Clipboard text updated.', data: { sessionId } });
    }

    getText(sessionId) {
        if (!sessionId) return null;
        return this.clipboards.get(sessionId) || null;
    }

    clear(sessionId) {
        if (!sessionId) return;
        this.clipboards.delete(sessionId);
        EventBus.emit('clipboard.cleared', { severity: 'Info', source: 'ClipboardManager', message: 'Clipboard cleared.', data: { sessionId } });
    }
}
