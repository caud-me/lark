import { EventBus } from '../kernel/SystemEventBus.js';

/**
 * WindowService
 *
 * Responsibility:
 * Exposes a public API for applications to create and manipulate their windows.
 *
 * Does NOT:
 * - Control z-order internally
 */
export class WindowService {
    constructor(windowManager) {
        this.windowManager = windowManager;
    }

    /**
     * Requests the creation of a new window.
     * @param {Object} options - { title, pid }
     * @returns {Object} { id, contentElement }
     */
    createWindow(options) {
        EventBus.emit('windowService:create', { severity: 'Info', source: 'WindowService', message: `Requested creation of window (PID: ${options.pid})` });
        return this.windowManager.createWindow(options);
    }

    /**
     * Closes a window.
     * @param {string} id 
     */
    closeWindow(id) {
        EventBus.emit('windowService:close', { severity: 'Info', source: 'WindowService', message: `Requested close of window ${id}` });
        this.windowManager.closeWindow(id);
    }

    /**
     * Brings a window to the front.
     * @param {string} id 
     */
    focusWindow(id) {
        EventBus.emit('windowService:focus', { severity: 'Info', source: 'WindowService', message: `Requested focus of window ${id}` });
        this.windowManager.focusWindow(id);
    }

    /**
     * Minimizes a window (window shade).
     * @param {string} id 
     */
    minimizeWindow(id) {
        this.windowManager.minimizeWindow(id);
    }

    /**
     * Maximizes a window.
     * @param {string} id 
     */
    maximizeWindow(id) {
        this.windowManager.maximizeWindow(id);
    }

    /**
     * Restores a window to its previous state.
     * @param {string} id 
     */
    restoreWindow(id) {
        this.windowManager.restoreWindow(id);
    }
}
