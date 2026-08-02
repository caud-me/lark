import { EventBus } from '../../1-kernel/SystemEventBus.js';
import { EnvironmentType } from '../../3-system/EnvironmentType.js';

/**
 * Declarative Geometry Formulas for Window Snapping (Constitution Section 22)
 */
export const formula_snapLeft = (workspace) => ({
    x: 0,
    y: 0,
    w: Math.floor(workspace.width / 2),
    h: workspace.height
});

export const formula_snapRight = (workspace) => ({
    x: Math.floor(workspace.width / 2),
    y: 0,
    w: Math.floor(workspace.width / 2),
    h: workspace.height
});

export const formula_snapMaximize = (workspace) => ({
    x: 0,
    y: 0,
    w: workspace.width,
    h: workspace.height
});

export const formula_snapTopLeft = (workspace) => ({
    x: 0,
    y: 0,
    w: Math.floor(workspace.width / 2),
    h: Math.floor(workspace.height / 2)
});

export const formula_snapTopRight = (workspace) => ({
    x: Math.floor(workspace.width / 2),
    y: 0,
    w: Math.floor(workspace.width / 2),
    h: Math.floor(workspace.height / 2)
});

export const formula_snapBottomLeft = (workspace) => ({
    x: 0,
    y: Math.floor(workspace.height / 2),
    w: Math.floor(workspace.width / 2),
    h: Math.floor(workspace.height / 2)
});

export const formula_snapBottomRight = (workspace) => ({
    x: Math.floor(workspace.width / 2),
    y: Math.floor(workspace.height / 2),
    w: Math.floor(workspace.width / 2),
    h: Math.floor(workspace.height / 2)
});

export const formula_detectSnapZone = (clientX, clientY, workspace, edgeThreshold = 20, cornerThreshold = 60) => {
    const isNearLeft = clientX <= edgeThreshold;
    const isNearRight = clientX >= workspace.width - edgeThreshold;
    const isNearTop = clientY <= edgeThreshold;
    const isNearBottom = clientY >= workspace.height - edgeThreshold;

    // Corner Quarter-Grid Snapping
    if ((isNearLeft || clientX <= cornerThreshold) && (isNearTop || clientY <= cornerThreshold)) return 'top-left';
    if ((isNearRight || clientX >= workspace.width - cornerThreshold) && (isNearTop || clientY <= cornerThreshold)) return 'top-right';
    if ((isNearLeft || clientX <= cornerThreshold) && (isNearBottom || clientY >= workspace.height - cornerThreshold)) return 'bottom-left';
    if ((isNearRight || clientX >= workspace.width - cornerThreshold) && (isNearBottom || clientY >= workspace.height - cornerThreshold)) return 'bottom-right';

    // Edge Half-Grid & Maximize Snapping
    if (isNearTop) return 'maximize';
    if (isNearLeft) return 'left';
    if (isNearRight) return 'right';

    return null;
};

/**
 * WindowService
 *
 * STABLE PUBLIC PLATFORM API (LDE 27.7.9)
 *
 * Responsibility:
 * Exposes safe, high-level public APIs for applications and processes to request window operations.
 * Emits semantic window events (`window.created`, `window.focused`, `window.closed`, `window.minimized`, `window.restored`).
 *
 * Does NOT:
 * - Render visual WindowFrame DOM elements directly (delegated to WindowSurface)
 * - Own runtime window z-order state machine (delegated to WindowManager)
 */
export class WindowService {
    constructor(windowManager, registry) {
        this.windowManager = windowManager;
        this.registry = registry;
    }

    /**
     * Snaps a window to a target layout zone ('left', 'right', 'maximize').
     * @param {string} id - Window ID
     * @param {string} targetZone - Target snap zone
     */
    snapWindow(id, targetZone) {
        EventBus.emit('windowService:snap', { severity: 'Info', source: 'WindowService', message: `Requested snap of window ${id} to ${targetZone}` });
        return this.windowManager.snapWindow(id, targetZone);
    }

    /**
     * Centers a window in the workspace viewport.
     * @param {string} id - Window ID
     */
    centerWindow(id) {
        EventBus.emit('windowService:center', { severity: 'Info', source: 'WindowService', message: `Requested center of window ${id}` });
        return this.windowManager.centerWindow(id);
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

        // Default workspace assignment (optional dependency)
        if (!options.workspaceId && this.registry) {
            const workspaceService = this.registry.get('WorkspaceService');
            if (workspaceService) {
                options.workspaceId = workspaceService.getActiveWorkspaceId();
            }
        }

        // Fetch window host and window surface from DesktopEnvironmentService to decouple WindowManager
        if (sessionId && this.registry) {
            const desktopEnvService = this.registry.get('DesktopEnvironmentService');
            if (desktopEnvService) {
                const env = desktopEnvService.getCurrent(sessionId);
                if (env) {
                    if (typeof env.getWindowHost === 'function') {
                        options.host = env.getWindowHost();
                    }
                    if (env.windowSurface) {
                        options.windowSurface = env.windowSurface;
                    }
                }
            }
        }

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
     * Alias for setWindowSize.
     * @param {string} id 
     * @param {number} width 
     * @param {number} height 
     */
    resizeWindow(id, width, height) {
        this.setWindowSize(id, width, height);
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

    getOwnWindows(pid) {
        if (!pid) return [];
        return this.windowManager._getWindowsByPid(pid) || [];
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
     * Returns a list of window state objects ordered from Most-Recently-Used to Least-Recently-Used.
     * @returns {Array<Object>}
     */
    getMRUWindowList() {
        return this.windowManager.getMRUWindowList();
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

    _bindEvent(eventName, callback) {
        const handler = (payload) => callback(payload.data || payload);
        EventBus.on(eventName, handler);
        return () => EventBus.off(eventName, handler);
    }

    onCreated(callback) { return this._bindEvent('window.created', callback); }
    onClosed(callback) { return this._bindEvent('window.closed', callback); }
    onFocused(callback) { return this._bindEvent('window.focused', callback); }
    onBlurred(callback) { return this._bindEvent('window.blurred', callback); }
    onMinimized(callback) { return this._bindEvent('window.minimized', callback); }
    onRestored(callback) { return this._bindEvent('window.restored', callback); }
    onMaximized(callback) { return this._bindEvent('window.maximized', callback); }

    /**
     * Queries display information facts via KernelDisplayAPI.
     */
    getDisplayInformation() {
        if (!this.registry) return null;
        const api = this.registry.get('KernelDisplayAPI');
        return api ? api.getDisplayInformation() : null;
    }

    /**
     * Checks if display subsystem supports transparency via KernelDisplayAPI.
     */
    supportsTransparency() {
        if (!this.registry) return true;
        const api = this.registry.get('KernelDisplayAPI');
        return api ? api.supportsTransparency() : true;
    }

    /**
     * Checks if display subsystem supports animations via KernelDisplayAPI.
     */
    supportsAnimations() {
        if (!this.registry) return true;
        const api = this.registry.get('KernelDisplayAPI');
        return api ? api.supportsAnimations() : true;
    }

    /**
     * Exports serializable window session state for restoration.
     * @returns {Array<Object>}
     */
    exportSessionState() {
        return this.windowManager.exportSessionState();
    }

    /**
     * Restores window positions and states from serializable session state.
     * @param {Array<Object>} serializedState 
     * @returns {boolean}
     */
    restoreSessionState(serializedState) {
        return this.windowManager.restoreSessionState(serializedState);
    }
}
