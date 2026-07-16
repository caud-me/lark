import { EventBus } from '../../kernel/SystemEventBus.js';
import { EnvironmentType } from '../../system/EnvironmentType.js';

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
    constructor(windowManager, registry) {
        this.windowManager = windowManager;
        this.registry = registry;
    }

    /**
     * Requests the creation of a new window.
     * @param {Object} options - { title, pid }
     * @returns {Object} { id, contentElement }
     */
    createWindow(options) {
        EventBus.emit('windowService:create', { severity: 'Info', source: 'WindowService', message: `Requested creation of window (PID: ${options.pid})` });

        // Resolve ownership metadata
        const processService = this.registry ? this.registry.get('ProcessService') : null;
        const sessionService = this.registry ? this.registry.get('SessionService') : null;

        let sessionId = null;
        let environmentType = EnvironmentType.DESKTOP;
        let desktopEnvironmentId = null;
        let processId = options.pid || null;

        if (processService && processId) {
            const proc = processService.getProcess(processId);
            if (proc) {
                sessionId = proc.sessionId || (sessionService ? sessionService.getCurrentSession()?.id : null);
                desktopEnvironmentId = proc.desktopEnvironmentId || null;
                
                const appId = proc.appId;
                if (appId === 'sys.login') {
                    environmentType = EnvironmentType.LOGIN;
                } else if (appId === 'sys.lock') {
                    environmentType = EnvironmentType.LOCK;
                } else if (appId === 'sys.recovery') {
                    environmentType = EnvironmentType.RECOVERY;
                } else if (appId === 'sys.desktop') {
                    environmentType = EnvironmentType.DESKTOP;
                } else if (appId === 'sys.welcome') {
                    environmentType = EnvironmentType.WELCOME;
                } else if (appId === 'sys.oobe') {
                    environmentType = EnvironmentType.BOOT;
                }
            }
        }

        if (!sessionId && sessionService) {
            sessionId = sessionService.getCurrentSession()?.id || null;
        }

        options.sessionId = sessionId;
        options.environmentType = environmentType;
        options.desktopEnvironmentId = desktopEnvironmentId;
        options.processId = processId;

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
     * Removes focus from a window.
     * @param {string} id 
     */
    blurWindow(id) {
        this.windowManager._blurWindow(id);
    }

    /**
     * Sets the position of a window.
     * @param {string} id 
     * @param {number} x 
     * @param {number} y 
     */
    setWindowPosition(id, x, y) {
        this.windowManager.setWindowPosition(id, x, y);
    }

    /**
     * Sets the size of a window.
     * @param {string} id 
     * @param {number} width 
     * @param {number} height 
     */
    setWindowSize(id, width, height) {
        this.windowManager.setWindowSize(id, width, height);
    }

    /**
     * Sets the title of a window.
     * @param {string} id 
     * @param {string} title 
     */
    setWindowTitle(id, title) {
        this.windowManager.setWindowTitle(id, title);
    }

    /**
     * Minimizes a window (window shade).
     * @param {string} id 
     */
    minimizeWindow(id) {
        this.windowManager.minimizeWindow(id);
    }

    /**
     * Toggles the minimized state of a window.
     * @param {string} id 
     */
    toggleMinimize(id) {
        if (this.isMinimized(id)) {
            this.restoreWindow(id);
        } else {
            this.minimizeWindow(id);
        }
    }

    /**
     * Checks if a window is minimized.
     * @param {string} id 
     * @returns {boolean}
     */
    isMinimized(id) {
        return this.windowManager.isMinimized(id);
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

    /**
     * Queries the current state of a window.
     * @param {string} id 
     * @returns {Object} State object containing geometry and flags
     */
    getWindowState(id) {
        return this.windowManager.getWindowState(id);
    }

    // --- Behavior APIs by PID ---

    /**
     * Brings all windows for a given PID to the front.
     * @param {number} pid 
     */
    focusWindowByPid(pid) {
        const windows = this.windowManager._getWindowsByPid(pid);
        windows.forEach(w => this.windowManager.focusWindow(w.id));
    }

    /**
     * Minimizes all windows for a given PID.
     * @param {number} pid 
     */
    minimizeWindowByPid(pid) {
        const windows = this.windowManager._getWindowsByPid(pid);
        windows.forEach(w => this.windowManager.minimizeWindow(w.id));
    }

    /**
     * Maximizes all windows for a given PID.
     * @param {number} pid 
     */
    maximizeWindowByPid(pid) {
        const windows = this.windowManager._getWindowsByPid(pid);
        windows.forEach(w => this.windowManager.maximizeWindow(w.id));
    }

    /**
     * Restores all windows for a given PID.
     * @param {number} pid 
     */
    restoreWindowByPid(pid) {
        const windows = this.windowManager._getWindowsByPid(pid);
        windows.forEach(w => this.windowManager.restoreWindow(w.id));
    }

    /**
     * Toggles the state of windows for a given PID.
     * @param {number} pid 
     */
    toggleWindowByPid(pid) {
        const windows = this.windowManager._getWindowsByPid(pid);
        windows.forEach(w => this.windowManager._toggleWindow(w.id));
    }

    /**
     * Closes all windows for a given PID.
     * @param {number} pid 
     */
    closeWindowByPid(pid) {
        const windows = this.windowManager._getWindowsByPid(pid);
        windows.forEach(w => this.windowManager.closeWindow(w.id));
    }

    /**
     * Returns all windows that have the specified inputPolicy option set.
     * Used by InputPolicy to determine which windows are permitted to receive
     * input while the session is locked, without exposing WindowManager internals.
     * @param {string} policyName - e.g. 'lockAllowed'
     * @returns {Array} Array of window state objects
     */
    getWindowsWithInputPolicy(policyName) {
        return this.windowManager._getWindowsByInputPolicy(policyName);
    }

    getAllWindows() {
        return this.windowManager.getAllWindows();
    }

    /**
     * Returns the environment type of the currently active (focused) window.
     * Used by DialogManager to stamp the correct environment context on dialogs
     * without accessing WindowManager internals directly.
     * Returns null if there is no active window or no environment type is set.
     * @returns {Symbol|null}
     */
    getActiveWindowEnvironmentType() {
        const activeId = this.windowManager.activeWindowId;
        if (!activeId) return null;
        const win = this.windowManager.windows.get(activeId);
        return (win && win.options && win.options.environmentType) ? win.options.environmentType : null;
    }

    /**
     * Returns the environment type associated with a specific window ID.
     * Used by InputPolicy to determine event ownership without accessing
     * WindowManager internals directly.
     * Returns null if the window does not exist or has no environment type set.
     * @param {string} windowId
     * @returns {Symbol|null}
     */
    getWindowEnvironmentType(windowId) {
        const win = this.windowManager.windows.get(windowId);
        return (win && win.options && win.options.environmentType) ? win.options.environmentType : null;
    }
}
