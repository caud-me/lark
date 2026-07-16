/**
 * ShortcutService
 * 
 * Responsibility:
 * Exposes API for registering and unregistering keyboard shortcuts.
 */
export class ShortcutService {
    constructor(shortcutManager) {
        this.shortcutManager = shortcutManager;
    }

    /**
     * Registers a keyboard shortcut.
     * @param {Object} config - { shortcut: 'Ctrl+C', scope: 'GLOBAL' | 'WINDOW' | 'APPLICATION' | 'TEXT_INPUT', handler: function }
     */
    register(config) {
        this.shortcutManager.register(config);
    }

    /**
     * Unregisters a keyboard shortcut.
     * @param {Object} config - The exact config object used in register
     */
    unregister(config) {
        this.shortcutManager.unregister(config);
    }
}
