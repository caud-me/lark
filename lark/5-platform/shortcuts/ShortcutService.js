/**
 * ShortcutService
 * 
 * Layer: 5-platform/shortcuts
 * Responsibility:
 * Exposes public OS API for registering and unregistering keyboard shortcuts.
 * Consumes Kernel KeyboardDriver contract to verify input device availability.
 * 
 * Does NOT:
 * - Direct browser KeyboardEvent listening where KeyboardDriver exists
 */
export class ShortcutService {
    constructor(shortcutManager, registry = null) {
        this.shortcutManager = shortcutManager;
        this.registry = registry;
    }

    _getInputAPI() {
        if (!this.registry) return null;
        return this.registry.get('KernelInputAPI');
    }

    /**
     * Registers a keyboard shortcut.
     * @param {Object} config - { shortcut: 'Ctrl+C', scope: 'GLOBAL' | 'WINDOW' | 'APPLICATION' | 'TEXT_INPUT', handler: function }
     */
    register(config) {
        const inputApi = this._getInputAPI();
        if (inputApi && typeof inputApi.isKeyboardAvailable === 'function' && !inputApi.isKeyboardAvailable()) {
            console.warn(`[ShortcutService] Keyboard input hardware unavailable. Skipping shortcut registration: ${config.shortcut}`);
            return;
        }
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
