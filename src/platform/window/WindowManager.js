import { WindowFrame } from './WindowFrame.js';
import { EventBus } from '../../kernel/SystemEventBus.js';
import { WindowStates } from '../../system/WindowStates.js';

/**
 * WindowManager
 *
 * Responsibility:
 * Owns runtime window state, z-order, focus, positioning, and lifecycle.
 *
 * Does NOT:
 * - Enforce permissions
 * - Enforce session policies
 * - Render application content
 */
export class WindowManager {
    constructor() {
        this.windows = new Map();
        this.nextZIndex = 100;
        this.activeWindowId = null;
        this.nextWindowId = 1;

        // Maps PID -> appId so the Manager can include appId in window events
        // without calling upward into ProcessService. Populated via EventBus.
        this.pidToAppId = new Map();

        // Keep pidToAppId in sync with the process lifecycle
        EventBus.on('process.started', (payload) => {
            if (payload.data && payload.data.pid && payload.data.process && payload.data.process.appId) {
                this.pidToAppId.set(payload.data.pid, payload.data.process.appId);
            }
        });

        // Automatically close windows when a process terminates
        EventBus.on('process.terminated', (payload) => {
            if (payload.data && payload.data.pid) {
                const pid = payload.data.pid;
                const windowsToClose = Array.from(this.windows.values()).filter(w => w.pid === pid);
                windowsToClose.forEach(w => this.closeWindow(w.id));
                // Clean up the appId mapping now that the process is gone
                this.pidToAppId.delete(pid);
            }
        });
        // Session state and global input policies have been extracted to InputPolicy.js
    }

    createWindow(options) {
        const id = `win-${this.nextWindowId++}`;
        const title = options.title || 'Window';
        
        let host = null;
        if (options.sessionId && this.registry) {
            const desktopEnvService = this.registry.get('DesktopEnvironmentService');
            const env = desktopEnvService ? desktopEnvService.getCurrent(options.sessionId) : null;
            if (env && env.windowHost) {
                host = env.windowHost;
            }
        }
        if (!host) {
            host = document.getElementById('window-host');
        }
        const hostWidth = host ? host.clientWidth : 800;
        const hostHeight = host ? host.clientHeight : 600;

        const { startX, startY } = this._calculateInitialPosition(options, hostWidth, hostHeight);
        const w = options.width || 400;
        const h = options.height || 300;

        // Runtime state persistence
        const winState = {
            id,
            pid: options.pid || null,
            state: WindowStates.NORMAL,
            x: startX,
            y: startY,
            w: w,
            h: h,
            options: options,
            saved: null // Used to restore from maximize/minimize
        };

        const frame = new WindowFrame(title, {
            onClose: () => {
                this.closeWindow(id);
                if (options.onClose) options.onClose();
            },
            onFocus: () => this.focusWindow(id),
            onDrag: (dx, dy) => this.moveWindow(id, dx, dy),
            onResize: (dx, dy, edge) => this.resizeWindow(id, dx, dy, edge),
            onMinimize: () => {
                const w = this.windows.get(id);
                if (w && w.state === WindowStates.MINIMIZED) this.restoreWindow(id);
                else this.minimizeWindow(id);
            },
            onMaximize: () => {
                const w = this.windows.get(id);
                if (w && w.state === WindowStates.MAXIMIZED) this.restoreWindow(id);
                else this.maximizeWindow(id);
            }
        }, options);

        winState.frame = frame;
        frame.element.id = id; // Required for Desktop to apply CSS via EventBus
        this.windows.set(id, winState);

        if (host) {
            host.appendChild(frame.element);
            this._applyState(id);
            this.focusWindow(id);
        }

        EventBus.emit('window.created', { severity: 'Info', source: 'WindowManager', message: `Created window ${id} for ${title}`, data: { id, pid: winState.pid } });
        return { id, contentElement: frame.contentElement };
    }

    getAllWindows() {
        return Array.from(this.windows.values());
    }

    _applyState(id) {
        const win = this.windows.get(id);
        if (!win) return;
        
        win.frame.setPosition(win.x, win.y);
        win.frame.setSize(win.w, win.h);
        win.frame.setState(win.state);
    }

    /**
     * Calculates the initial screen position for a new window.
     * Uses a cascading offset pattern so multiple windows don't perfectly overlap.
     * If options.center is set, the window is centered on the host instead.
     * @param {Object} options - Window creation options
     * @param {number} hostWidth - Width of the window host container
     * @param {number} hostHeight - Height of the window host container
     * @returns {{ startX: number, startY: number }}
     */
    _calculateInitialPosition(options, hostWidth, hostHeight) {
        const windowWidth = options.width || 400;
        const windowHeight = options.height || 300;

        if (options.center) {
            const centeredX = Math.max(0, (hostWidth - windowWidth) / 2);
            const centeredY = Math.max(0, (hostHeight - windowHeight) / 2);
            return { startX: centeredX, startY: centeredY };
        }

        // Cascade offset: windows appear slightly staggered so they are all visible
        const cascadeX = 100 + ((this.nextWindowId * 30) % 200);
        const cascadeY = 100 + ((this.nextWindowId * 30) % 200);
        return { startX: cascadeX, startY: cascadeY };
    }

    /**
     * Moves a window by a pixel delta. No-op if the window is maximized.
     * @param {string} id - Window ID
     * @param {number} dx - Horizontal delta in pixels
     * @param {number} dy - Vertical delta in pixels
     */
    moveWindow(id, dx, dy) {
        const win = this.windows.get(id);
        if (!win || win.state === WindowStates.MAXIMIZED) return;
        win.x += dx;
        win.y += dy;
        this._applyState(id);
    }

    /**
     * Resizes a window by a pixel delta on a given edge. No-op if maximized or minimized.
     * @param {string} id - Window ID
     * @param {number} dx - Horizontal delta in pixels
     * @param {number} dy - Vertical delta in pixels
     * @param {string} edge - Resize handle: 'right', 'bottom', or 'bottom-right'
     */
    resizeWindow(id, dx, dy, edge) {
        const win = this.windows.get(id);
        if (!win || win.state === WindowStates.MAXIMIZED || win.state === WindowStates.MINIMIZED) return;
        
        if (edge === 'right' || edge === 'bottom-right') {
            win.w = Math.max(200, win.w + dx); // min width 200
        }
        if (edge === 'bottom' || edge === 'bottom-right') {
            win.h = Math.max(150, win.h + dy); // min height 150
        }
        this._applyState(id);
    }

    /**
     * Sets the absolute position of a window. No-op if maximized.
     * @param {string} id - Window ID
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    setWindowPosition(id, x, y) {
        const win = this.windows.get(id);
        if (!win || win.state === WindowStates.MAXIMIZED) return;
        win.x = x;
        win.y = y;
        this._applyState(id);
    }

    /**
     * Sets the absolute size of a window. No-op if maximized or minimized.
     * @param {string} id - Window ID
     * @param {number} w - Width
     * @param {number} h - Height
     */
    setWindowSize(id, w, h) {
        const win = this.windows.get(id);
        if (!win || win.state === WindowStates.MAXIMIZED || win.state === WindowStates.MINIMIZED) return;
        win.w = Math.max(200, w);
        win.h = Math.max(150, h);
        this._applyState(id);
    }

    /**
     * Sets the title of a window.
     * @param {string} id - Window ID
     * @param {string} title - The new title
     */
    setWindowTitle(id, title) {
        const win = this.windows.get(id);
        if (!win || !win.frame) return;
        win.frame.setTitle(title);
    }

    /**
     * Minimizes a window. Saves the prior state so it can be restored correctly.
     * If the window is already minimized, this is a no-op.
     * @param {string} id - Window ID
     */
    minimizeWindow(id) {
        const win = this.windows.get(id);
        if (!win || win.state === WindowStates.MINIMIZED) return;
        
        win.savedState = win.state; // Remember if it was maximized
        win.state = WindowStates.MINIMIZED;
        this._applyState(id);
        EventBus.emit('window.minimized', { severity: 'Info', source: 'WindowManager', message: `Window ${id} minimized`, data: { id, pid: win.pid } });
        
        if (this.activeWindowId === id) {
            this._blurWindow(id);
        }
    }

    /**
     * Maximizes a window to fill the host container. Saves the prior geometry
     * so the window can be restored to its exact previous position and size.
     * If the window is already maximized, this is a no-op.
     * @param {string} id - Window ID
     */
    maximizeWindow(id) {
        const win = this.windows.get(id);
        if (!win || win.state === WindowStates.MAXIMIZED) return;
        
        win.saved = { x: win.x, y: win.y, w: win.w, h: win.h };
        win.state = WindowStates.MAXIMIZED;
        win.x = 0; 
        win.y = 0;
        
        const host = document.getElementById('window-host');
        win.w = host ? host.clientWidth : 800;
        win.h = host ? host.clientHeight : 600;
        
        this._applyState(id);
        EventBus.emit('window.maximized', { severity: 'Info', source: 'WindowManager', message: `Window ${id} maximized`, data: { id, pid: win.pid } });
    }

    /**
     * Restores a window from a minimized or maximized state back to NORMAL.
     * If the window was previously maximized, restores its saved geometry.
     * @param {string} id - Window ID
     */
    restoreWindow(id) {
        const win = this.windows.get(id);
        if (!win) return;
        
        if (win.state === WindowStates.MINIMIZED) {
            win.state = win.savedState || WindowStates.NORMAL;
        } else if (win.state === WindowStates.MAXIMIZED) {
            win.state = WindowStates.NORMAL;
            if (win.saved) {
                win.x = win.saved.x; 
                win.y = win.saved.y;
                win.w = win.saved.w; 
                win.h = win.saved.h;
            }
        }
        this._applyState(id);
        EventBus.emit('window.restored', { severity: 'Info', source: 'WindowManager', message: `Window ${id} restored`, data: { id, pid: win.pid } });
    }

    /**
     * Closes and destroys a window. Removes it from the DOM and cleans up state.
     * After closing, automatically focuses the next highest z-order window.
     * @param {string} id - Window ID
     */
    closeWindow(id) {
        if (this.windows.has(id)) {
            const win = this.windows.get(id);
            if (win.frame && typeof win.frame.destroy === 'function') {
                win.frame.destroy();
            } else {
                win.frame.element.remove();
            }
            this.windows.delete(id);
            
            if (this.activeWindowId === id) {
                this.activeWindowId = null;
            }
            EventBus.emit('window.closed', { severity: 'Info', source: 'WindowManager', message: `Closed window ${id}`, data: { id, pid: win.pid } });
            
            this._compressZIndex();
            this._focusTopWindow();
        }
    }

    _compressZIndex() {
        const sorted = Array.from(this.windows.values()).sort((a, b) => {
            const zA = parseInt(a.frame.element.style.zIndex || 0, 10);
            const zB = parseInt(b.frame.element.style.zIndex || 0, 10);
            return zA - zB;
        });

        let z = 100;
        sorted.forEach(w => {
            w.frame.setZIndex(z++);
        });
        this.nextZIndex = z;
    }

    _focusTopWindow() {
        if (this.windows.size === 0) return;
        
        let topWin = null;
        let maxZ = -1;
        this.windows.forEach(w => {
            if (w.state !== WindowStates.MINIMIZED) {
                const z = parseInt(w.frame.element.style.zIndex || 0, 10);
                if (z > maxZ) {
                    maxZ = z;
                    topWin = w;
                }
            }
        });

        if (topWin) {
            this.focusWindow(topWin.id);
        }
    }

    focusWindow(id) {
        if (this.windows.has(id)) {
            const win = this.windows.get(id);
            
            // Blur previous active window if different
            if (this.activeWindowId && this.activeWindowId !== id) {
                this._blurWindow(this.activeWindowId);
            }

            win.frame.setZIndex(this.nextZIndex++);
            this.activeWindowId = id;
            
            this.windows.forEach(w => {
                w.frame.setActive(w.id === id);
            });

            // Include appId in the event payload so SessionManager can update
            // lastFocusedApp without needing to call back into ProcessService.
            const appId = this.pidToAppId.get(win.pid) || null;
            EventBus.emit('window.focused', { severity: 'Info', source: 'WindowManager', message: `Window ${id} focused`, data: { id, pid: win.pid, appId } });
        }
    }

    _blurWindow(id) {
        const win = this.windows.get(id);
        if (win) {
            this.activeWindowId = null;
            win.frame.setActive(false);
            EventBus.emit('window.blurred', { severity: 'Info', source: 'WindowManager', message: `Window ${id} blurred`, data: { id, pid: win.pid } });
        }
    }

    _getWindowsByPid(pid) {
        return Array.from(this.windows.values()).filter(w => w.pid === pid);
    }

    /**
     * Returns all window state objects whose inputPolicy option matches the given policy name.
     * Used by WindowService to expose policy information without leaking internals.
     * @param {string} policyName - e.g. 'lockAllowed'
     * @returns {Array} Array of window state objects
     */
    _getWindowsByInputPolicy(policyName) {
        const matches = [];
        for (const win of this.windows.values()) {
            if (win.options && win.options.inputPolicy === policyName) {
                matches.push(win);
            }
        }
        return matches;
    }

    _toggleWindow(id) {
        const win = this.windows.get(id);
        if (!win) return;

        if (this.activeWindowId === id) {
            // It is focused -> Minimize
            this.minimizeWindow(id);
        } else {
            // It is either minimized or just in background
            if (win.state === WindowStates.MINIMIZED) {
                this.restoreWindow(id);
            }
            this.focusWindow(id);
        }
    }

    /**
     * Checks if a window is currently minimized.
     * @param {string} id - Window ID
     * @returns {boolean}
     */
    isMinimized(id) {
        const win = this.windows.get(id);
        return win ? win.state === WindowStates.MINIMIZED : false;
    }

    /**
     * Returns the current state of a window.
     * @param {string} id - Window ID
     * @returns {Object|null}
     */
    getWindowState(id) {
        const win = this.windows.get(id);
        if (!win) return null;
        return {
            id: win.id,
            pid: win.pid,
            state: win.state,
            minimized: win.state === WindowStates.MINIMIZED,
            maximized: win.state === WindowStates.MAXIMIZED,
            focused: this.activeWindowId === win.id,
            x: win.x,
            y: win.y,
            width: win.w,
            height: win.h
        };
    }
}
