/**
 * ContextMenuManager
 * 
 * Responsibility:
 * Owns the mutable runtime state of the active context menu.
 * 
 * Does NOT:
 * - Render DOM elements or manipulate document layers (handled by ContextMenuSurface)
 * - Emit events or handle observer subscriptions (handled by ContextMenuService)
 */
export class ContextMenuManager {
    constructor() {
        this.activeMenu = null;
    }

    /**
     * Sets the active context menu state object.
     * @param {Object} menuState - { x, y, items, resolve }
     */
    showMenu(menuState) {
        this.activeMenu = menuState;
    }

    /**
     * Clears and returns the current context menu state.
     * @returns {Object|null}
     */
    dismissMenu() {
        const previous = this.activeMenu;
        this.activeMenu = null;
        return previous;
    }

    /**
     * Returns an immutable snapshot of the active context menu state.
     * @returns {Object|null}
     */
    getActiveMenu() {
        if (!this.activeMenu) return null;
        return {
            x: this.activeMenu.x,
            y: this.activeMenu.y,
            items: this.activeMenu.items ? [...this.activeMenu.items] : []
        };
    }
}
