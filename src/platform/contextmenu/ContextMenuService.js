import { EventBus } from '../../kernel/SystemEventBus.js';

/**
 * ContextMenuService
 * 
 * Responsibility:
 * Exposes a clean API for showing context menus.
 * 
 * Does NOT:
 * - Handle DOM rendering (handled by ContextMenuManager)
 */
export class ContextMenuService {
    constructor(contextMenuManager) {
        this.contextMenuManager = contextMenuManager;
    }

    /**
     * Shows a context menu at the specified coordinates.
     * @param {number} x 
     * @param {number} y 
     * @param {Array} items - Array of { id, label, icon, type? }
     * @returns {Promise<string|null>} The ID of the clicked item, or null if dismissed
     */
    showMenu(x, y, items) {
        return new Promise(resolve => {
            this.contextMenuManager.showMenu(x, y, items, resolve);
        });
    }
}
