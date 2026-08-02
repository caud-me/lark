import { EventBus } from '../../1-kernel/SystemEventBus.js';

/**
 * ContextMenuService
 * 
 * Layer: 5-platform/contextmenu
 * Responsibility:
 * Exposes clean OS API for showing context menus and observing menu state changes.
 * Consumes Kernel PointerDriver contract to verify pointer input hardware availability.
 * 
 * Does NOT:
 * - Direct DOM rendering (delegated to ContextMenuSurface)
 * - Raw pointer listener binding where PointerDriver exists
 */
export class ContextMenuService {
    constructor(contextMenuManager, registry = null) {
        this.contextMenuManager = contextMenuManager;
        this.registry = registry;
    }

    _getInputAPI() {
        if (!this.registry) return null;
        return this.registry.get('KernelInputAPI');
    }

    /**
     * Shows a context menu at the specified coordinates.
     * @param {number} x 
     * @param {number} y 
     * @param {Array} items - Array of { id, label, icon, type? }
     * @returns {Promise<string|null>} The ID of the clicked item, or null if dismissed
     */
    showMenu(x, y, items) {
        const inputApi = this._getInputAPI();
        if (inputApi && typeof inputApi.isPointerAvailable === 'function' && !inputApi.isPointerAvailable()) {
            console.warn(`[ContextMenuService] Pointer input device unavailable. Dismissing menu request.`);
            return Promise.resolve(null);
        }

        return new Promise(resolve => {
            this.contextMenuManager.showMenu({ x, y, items, resolve });
            EventBus.emit('contextmenu.changed');
        });
    }

    /**
     * Dismisses the current active context menu with an optional result ID.
     * @param {string|null} resultId 
     */
    dismissMenu(resultId = null) {
        const previousState = this.contextMenuManager.dismissMenu();
        if (previousState && typeof previousState.resolve === 'function') {
            previousState.resolve(resultId);
        }
        EventBus.emit('contextmenu.changed');
    }

    /**
     * Returns an immutable snapshot of the active context menu state.
     * @returns {Object|null}
     */
    getActiveMenu() {
        return this.contextMenuManager.getActiveMenu();
    }

    /**
     * Semantic event subscription method for context menu changes.
     * @param {Function} callback 
     * @returns {Function} Unsubscribe function
     */
    onMenuChanged(callback) {
        EventBus.on('contextmenu.changed', callback);
        return () => {
            EventBus.off('contextmenu.changed', callback);
        };
    }
}
