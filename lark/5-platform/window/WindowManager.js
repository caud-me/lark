import { EventBus } from '../../1-kernel/SystemEventBus.js';
import { WindowStates } from '../../3-system/WindowStates.js';
import { ObjectUtils } from '../../1-kernel/utils/ObjectUtils.js';
import { 
    formula_snapLeft, 
    formula_snapRight, 
    formula_snapMaximize,
    formula_snapTopLeft,
    formula_snapTopRight,
    formula_snapBottomLeft,
    formula_snapBottomRight,
    formula_detectSnapZone 
} from './WindowService.js';

/**
 * WindowManager
 *
 * Responsibility:
 * Owns runtime window state, z-order, focus, positioning, and lifecycle.
 *
 * Does NOT:
 * - Direct visual WindowFrame construction (delegated to WindowSurface)
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
        this._nextTransitionId = 1;
        this.mruFocusStack = [];

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

        EventBus.on('workspace.switched', (payload) => {
            if (!payload || !payload.current) return;
            this.reconcileWorkspaceVisibility(payload.current);
        });

        EventBus.on('workspace.deleted', (payload) => {
            if (!payload || !payload.deletedId || !payload.fallbackId) return;
            const { deletedId, fallbackId } = payload;
            
            for (const win of this.windows.values()) {
                if (win.workspaceId === deletedId) {
                    win.workspaceId = fallbackId;
                }
            }
        });

        EventBus.on('workspace.windowMoved', (payload) => {
            const data = payload ? (payload.data || payload) : null;
            if (data && data.windowId && data.targetWorkspaceId) {
                const win = this.windows.get(data.windowId);
                if (win) {
                    win.workspaceId = data.targetWorkspaceId;
                    this._applyState(data.windowId);
                }
            }
        });
        // Session state and global input policies have been extracted to InputPolicy.js
    }

    createWindow(options, frameFactory = null) {
        const id = `win-${this.nextWindowId++}`;
        const title = options.title || 'Window';

        // Route surface creation through KernelDisplayAPI (Constitution Section 24)
        if (this.serviceRegistry) {
            const displayApi = this.serviceRegistry.get('KernelDisplayAPI');
            if (displayApi && typeof displayApi.createSurface === 'function') {
                displayApi.createSurface(id, options.width || 400, options.height || 300);
            }
        }
        
        let host = options.host || document.getElementById('window-host');
        const hostWidth = host ? host.clientWidth : 800;
        const hostHeight = host ? host.clientHeight : 600;

        const { startX, startY } = this._calculateInitialPosition(options, hostWidth, hostHeight);
        const w = options.width || 400;
        const h = options.height || 300;

        // Runtime state persistence
        const appId = options.appId || (options.pid ? this.pidToAppId.get(options.pid) : null);
        const winState = {
            id,
            pid: options.pid || null,
            appId,
            title,
            workspaceId: options.workspaceId || 'workspace-1',
            isWorkspaceVisible: true,
            state: WindowStates.NORMAL,
            x: startX,
            y: startY,
            w: w,
            h: h,
            options: options,
            saved: null // Used to restore from maximize/minimize
        };

        // Restore saved window geometry if available for this app
        if (this.serviceRegistry && (options.appId || options.pid)) {
            const userSettingsService = this.serviceRegistry.get('UserSettingsService');
            const appId = options.appId || this.pidToAppId.get(options.pid);
            if (userSettingsService && appId) {
                const savedGeo = userSettingsService.getSetting(`window.geometry.${appId}`);
                if (savedGeo && savedGeo.w && savedGeo.h) {
                    winState.x = savedGeo.x;
                    winState.y = savedGeo.y;
                    winState.w = savedGeo.w;
                    winState.h = savedGeo.h;
                }
            }
        }

        const callbacks = {
            onClose: () => {
                this.closeWindow(id);
                if (options.onClose) options.onClose();
            },
            onFocus: () => this.focusWindow(id),
            onDrag: (dx, dy, clientX, clientY) => this.moveWindow(id, dx, dy, clientX, clientY),
            onDragEnd: (clientX, clientY) => this.handleDragEnd(id, clientX, clientY),
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
            },
            onContextMenu: (clientX, clientY) => this._showWindowContextMenu(id, clientX, clientY)
        };

        let frame = null;
        if (typeof frameFactory === 'function') {
            frame = frameFactory(id, title, options, callbacks);
        } else if (options.windowSurface && typeof options.windowSurface.createFrame === 'function') {
            frame = options.windowSurface.createFrame(id, title, options, callbacks);
        }

        winState.frame = frame;
        if (frame && frame.element) {
            frame.element.id = id;
        }
        this.windows.set(id, winState);

        // Ensure window gets proper workspace visibility state if created in non-active workspace
        const wsSvc = this.serviceRegistry ? this.serviceRegistry.get('WorkspaceService') : null;
        const activeWsId = wsSvc ? wsSvc.getActiveWorkspaceId() : (window.LDE_ACTIVE_WORKSPACE_ID || 'workspace-1');
        if (winState.workspaceId !== activeWsId) {
            winState.isWorkspaceVisible = false;
        }

        if (host && frame) {
            this._applyState(id);
            if (!winState.isWorkspaceVisible && frame.element) {
                frame.element.classList.add('workspace-hidden');
            }
            // Only focus if it belongs to the current workspace
            if (winState.isWorkspaceVisible) {
                this.focusWindow(id);
            }
        }

        this._emitTransition(winState, 'none', winState.state, options.sessionRestore ? 'sessionRestore' : 'windowOpen', options.interactionSource || 'system');
        EventBus.emit('window.created', { severity: 'Info', source: 'WindowManager', message: `Created window ${id} for ${title}`, data: { id, pid: winState.pid } });
        return { id, contentElement: frame ? frame.contentElement : null };
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

        // Handle minimize visibility at DOM level (respecting motion policy animations)
        if (win.state === WindowStates.MINIMIZED) {
            const presentationEffectsService = this.registry ? this.registry.get('PresentationEffectsService') : null;
            const policy = presentationEffectsService ? presentationEffectsService.getMotionPolicy('minimize') : null;
            if (!policy || !policy.enabled) {
                win.frame.element.style.display = 'none';
            }
        } else {
            win.frame.element.style.display = '';
        }
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
     * Dynamically calculates the available workspace bounds (width, height, top, left),
     * taking into account the live height of the Taskbar surface (or any shell bar).
     * Future-proofed for Taskbar rewrites, auto-hide, or custom shell bar layouts.
     * @returns {{ width: number, height: number, x: number, y: number }}
     */
    _getWorkspaceBounds() {
        const host = document.getElementById('window-host');
        const hostWidth = host ? host.clientWidth : window.innerWidth;
        const hostHeight = host ? host.clientHeight : window.innerHeight;

        // Dynamically measure Taskbar height if present and visible in DOM
        const taskbar = document.querySelector('.lde-taskbar, .shell-taskbar, #taskbar-surface, [data-component="taskbar"]');
        let taskbarHeight = 0;
        if (taskbar) {
            const style = window.getComputedStyle(taskbar);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
                const rect = taskbar.getBoundingClientRect();
                taskbarHeight = rect.height || taskbar.offsetHeight || 0;
            }
        }

        const availableHeight = Math.max(100, hostHeight - taskbarHeight);

        return {
            width: hostWidth,
            height: availableHeight,
            x: 0,
            y: 0
        };
    }

    _getSnapBounds(zone, workspace) {
        if (zone === 'left') return formula_snapLeft(workspace);
        if (zone === 'right') return formula_snapRight(workspace);
        if (zone === 'maximize') return formula_snapMaximize(workspace);
        if (zone === 'top-left') return formula_snapTopLeft(workspace);
        if (zone === 'top-right') return formula_snapTopRight(workspace);
        if (zone === 'bottom-left') return formula_snapBottomLeft(workspace);
        if (zone === 'bottom-right') return formula_snapBottomRight(workspace);
        return null;
    }

    /**
     * Validates state transition integrity. Prevents invalid state leaps.
     * @private
     * @param {string} previousState 
     * @param {string} nextState 
     * @param {string} transitionReason 
     * @returns {boolean}
     */
    _validateTransition(previousState, nextState, transitionReason) {
        if (previousState === WindowStates.MINIMIZED && nextState === WindowStates.MAXIMIZED) {
            EventBus.emit('sys.warn', { severity: 'Warn', source: 'WindowManager', message: `Invalid window state transition rejected: ${previousState} -> ${nextState} via ${transitionReason}` });
            return false;
        }
        if (previousState === 'fullscreen' && (nextState === 'snappedLeft' || nextState === 'snappedRight')) {
            EventBus.emit('sys.warn', { severity: 'Warn', source: 'WindowManager', message: `Invalid window state transition rejected: ${previousState} -> ${nextState} via ${transitionReason}` });
            return false;
        }
        return true;
    }

    /**
     * Emits an immutable WindowTransition fact payload via EventBus.
     * @private
     * @param {Object} win - Window instance
     * @param {string} previousState 
     * @param {string} nextState 
     * @param {string} transitionReason 
     * @param {string} [interactionSource='system'] 
     */
    _emitTransition(win, previousState, nextState, transitionReason, interactionSource = 'system') {
        if (!win) return;
        this._validateTransition(previousState, nextState, transitionReason);

        const transition = ObjectUtils.deepFreeze({
            transitionId: this._nextTransitionId++,
            windowId: win.id,
            pid: win.pid,
            previousState: previousState || 'none',
            nextState: nextState || 'none',
            transitionReason,
            interactionSource,
            timestamp: new Date().toISOString()
        });

        EventBus.emit('window.transition', {
            severity: 'Info',
            source: 'WindowManager',
            message: `Window transition #${transition.transitionId}: ${win.id} (${previousState} -> ${nextState}) via ${transitionReason}`,
            data: transition
        });
    }

    /**
     * Centers a window in the active workspace viewport.
     * Restores window if minimized, unsnaps if snapped or maximized.
     * @param {string} id - Window ID
     */
    centerWindow(id, interactionSource = 'keyboard') {
        const win = this.windows.get(id);
        if (!win) return;

        const oldState = win.state;
        if (win.state === WindowStates.MINIMIZED) {
            this.restoreWindow(id, interactionSource);
        }

        if (win.state === WindowStates.MAXIMIZED || win.snapZone) {
            const savedW = win.saved ? win.saved.w : (win.w || 800);
            const savedH = win.saved ? win.saved.h : (win.h || 600);

            win.state = WindowStates.NORMAL;
            win.snapZone = null;
            win.w = savedW;
            win.h = savedH;
            win.saved = null;
        }

        const workspace = this._getWorkspaceBounds();
        const targetW = win.w || 800;
        const targetH = win.h || 600;

        win.x = Math.max(0, Math.floor((workspace.width - targetW) / 2));
        win.y = Math.max(0, Math.floor((workspace.height - targetH) / 2));

        this._emitTransition(win, oldState, WindowStates.NORMAL, 'centerCommand', interactionSource);
        this._applyState(id);
        this.focusWindow(id);
        EventBus.emit('window.centered', { severity: 'Info', source: 'WindowManager', message: `Window ${id} centered`, data: { id, pid: win.pid } });
    }

    /**
     * Renders titlebar context menu for window operations.
     * @private
     */
    _showWindowContextMenu(id, x, y) {
        const contextMenuService = this.registry ? this.registry.get('ContextMenuService') : null;
        if (!contextMenuService) return;

        const win = this.windows.get(id);
        if (!win) return;

        contextMenuService.showMenu(x, y, [
            {
                id: 'restore',
                label: 'Restore',
                icon: '<i>&#xE923;</i>',
                disabled: win.state === WindowStates.NORMAL && !win.snapZone,
                action: () => this.restoreWindow(id)
            },
            {
                id: 'minimize',
                label: 'Minimize',
                icon: '<i>&#xE921;</i>',
                action: () => this.minimizeWindow(id)
            },
            {
                id: 'maximize',
                label: win.state === WindowStates.MAXIMIZED ? 'Restore' : 'Maximize',
                icon: '<i>&#xE922;</i>',
                action: () => win.state === WindowStates.MAXIMIZED ? this.restoreWindow(id) : this.maximizeWindow(id)
            },
            {
                id: 'center',
                label: 'Center Window',
                icon: '<i>&#xE737;</i>',
                action: () => this.centerWindow(id)
            },
            { type: 'separator' },
            {
                id: 'close',
                label: 'Close',
                icon: '<i>&#xE8BB;</i>',
                action: () => this.closeWindow(id)
            }
        ]);
    }

    /**
     * Moves a window by a pixel delta. Evaluates snap zone if pointer coordinates are provided.
     * Reverts snapped or maximized windows back to previous floating dimensions on drag.
     * @param {string} id - Window ID
     * @param {number} dx - Horizontal delta in pixels
     * @param {number} dy - Vertical delta in pixels
     * @param {number} [clientX] - Pointer X coordinate
     * @param {number} [clientY] - Pointer Y coordinate
     */
    moveWindow(id, dx, dy, clientX = null, clientY = null) {
        const win = this.windows.get(id);
        if (!win) return;

        // If window is maximized or snapped, unsnap/unmaximize on drag and restore saved floating dimensions
        if (win.state === WindowStates.MAXIMIZED || win.snapZone) {
            const oldState = win.state === WindowStates.MAXIMIZED ? WindowStates.MAXIMIZED : (win.snapZone === 'left' ? 'snappedLeft' : 'snappedRight');
            const savedW = win.saved ? win.saved.w : 800;
            const savedH = win.saved ? win.saved.h : 600;

            win.state = WindowStates.NORMAL;
            win.snapZone = null;
            win.w = savedW;
            win.h = savedH;

            // Reposition window under pointer if coordinates are provided
            if (clientX !== null && clientY !== null) {
                win.x = Math.max(0, clientX - Math.floor(savedW / 2));
                win.y = Math.max(0, clientY - 15);
            }
            win.saved = null;
            this._emitTransition(win, oldState, WindowStates.NORMAL, 'titlebarDrag', 'pointer');
            this._applyState(id);
            EventBus.emit('window.restored', { severity: 'Info', source: 'WindowManager', message: `Window ${id} restored on drag`, data: { id, pid: win.pid } });
        } else {
            win.x += dx;
            win.y += dy;
        }

        if (clientX !== null && clientY !== null) {
            const workspace = this._getWorkspaceBounds();
            const zone = formula_detectSnapZone(clientX, clientY, workspace);
            if (zone) {
                const bounds = this._getSnapBounds(zone, workspace);
                this.showSnapPreview(bounds);
            } else {
                this.hideSnapPreview();
            }
        }

        // Clamp window titlebar within visible workspace bounds
        const workspace = this._getWorkspaceBounds();
        const minVisibleX = -(win.w - 40); // Keep at least 40px of titlebar horizontally inside screen
        const maxVisibleX = workspace.width - 40;
        const minVisibleY = 0; // Don't allow titlebar to move above top screen edge
        const maxVisibleY = Math.max(0, workspace.height - 32); // Keep titlebar visible above taskbar

        win.x = Math.max(minVisibleX, Math.min(maxVisibleX, win.x));
        win.y = Math.max(minVisibleY, Math.min(maxVisibleY, win.y));

        this._applyState(id);
    }

    /**
     * Handles drag release and applies snapping if inside a snap zone.
     * @param {string} id - Window ID
     * @param {number} clientX - Pointer X coordinate
     * @param {number} clientY - Pointer Y coordinate
     */
    handleDragEnd(id, clientX, clientY) {
        this.hideSnapPreview();
        if (clientX !== undefined && clientY !== undefined) {
            const workspace = this._getWorkspaceBounds();

            const zone = formula_detectSnapZone(clientX, clientY, workspace);
            if (zone) {
                this.snapWindow(id, zone, 'pointer');
            }
        }
    }

    /**
     * Snaps a window to a target layout zone ('left', 'right', 'maximize', 'top-left', 'top-right', 'bottom-left', 'bottom-right').
     * @param {string} id - Window ID
     * @param {string} targetZone - Target snap zone
     * @param {string} [interactionSource='pointer']
     */
    snapWindow(id, targetZone, interactionSource = 'pointer') {
        const win = this.windows.get(id);
        if (!win || !targetZone) return;

        const workspace = this._getWorkspaceBounds();

        if (targetZone === 'maximize') {
            return this.maximizeWindow(id, interactionSource);
        }

        const oldState = win.state;
        if (!win.saved && win.state === WindowStates.NORMAL) {
            win.saved = { x: win.x, y: win.y, w: win.w, h: win.h };
        }

        const geometry = this._getSnapBounds(targetZone, workspace);
        if (geometry) {
            win.x = geometry.x;
            win.y = geometry.y;
            win.w = geometry.w;
            win.h = geometry.h;
            win.snapZone = targetZone;
            const nextState = targetZone === 'left' ? 'snappedLeft' : (targetZone === 'right' ? 'snappedRight' : WindowStates.NORMAL);
            const reason = interactionSource === 'keyboard' ? 'snapShortcut' : 'snapDrag';
            this._emitTransition(win, oldState, nextState, reason, interactionSource);
            this._applyState(id);
            EventBus.emit('window.snapped', { severity: 'Info', source: 'WindowManager', message: `Window ${id} snapped to ${targetZone}`, data: { id, targetZone, pid: win.pid } });
        }
    }

    /**
     * Shows a translucent snap preview overlay over the target geometry bounds.
     * @param {Object} bounds - { x, y, w, h }
     */
    showSnapPreview(bounds) {
        if (!bounds) return;
        let preview = document.getElementById('lde-snap-preview');
        if (!preview) {
            preview = document.createElement('div');
            preview.id = 'lde-snap-preview';
            preview.className = 'lde-snap-preview';
            preview.style.position = 'absolute';
            preview.style.zIndex = '999999';
            preview.style.pointerEvents = 'none';
            preview.style.transition = 'all 0.15s ease-out';
            const host = document.getElementById('window-host') || document.body;
            host.appendChild(preview);
        }
        preview.style.left = `${bounds.x}px`;
        preview.style.top = `${bounds.y}px`;
        preview.style.width = `${bounds.w}px`;
        preview.style.height = `${bounds.h}px`;
        preview.style.display = 'block';
    }

    /**
     * Hides the translucent snap preview overlay.
     */
    hideSnapPreview() {
        const preview = document.getElementById('lde-snap-preview');
        if (preview) {
            preview.style.display = 'none';
        }
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
        
        const MIN_W = 200;
        const MIN_H = 150;

        let newX = win.x;
        let newY = win.y;
        let newW = win.w;
        let newH = win.h;

        if (edge.includes('right')) {
            newW = Math.max(MIN_W, win.w + dx);
        } else if (edge.includes('left')) {
            const potentialW = win.w - dx;
            if (potentialW >= MIN_W) {
                newW = potentialW;
                newX = win.x + dx;
            }
        }

        if (edge.includes('bottom')) {
            newH = Math.max(MIN_H, win.h + dy);
        } else if (edge.includes('top')) {
            const potentialH = win.h - dy;
            if (potentialH >= MIN_H) {
                newH = potentialH;
                newY = win.y + dy;
            }
        }

        win.x = newX;
        win.y = newY;
        win.w = newW;
        win.h = newH;

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
        if (!win) return;
        win.title = title;
        if (win.frame && typeof win.frame.setTitle === 'function') {
            win.frame.setTitle(title);
        }
    }

    /**
     * Minimizes a window. Saves the prior state so it can be restored correctly.
     * If the window is already minimized, this is a no-op.
     * @param {string} id - Window ID
     */
    minimizeWindow(id, interactionSource = 'pointer') {
        const win = this.windows.get(id);
        if (!win || win.state === WindowStates.MINIMIZED) return;
        
        const oldState = win.state;
        win.savedState = oldState; // Remember if it was maximized
        win.state = WindowStates.MINIMIZED;

        this._emitTransition(win, oldState, WindowStates.MINIMIZED, 'minimizeButton', interactionSource);
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
    maximizeWindow(id, interactionSource = 'pointer') {
        const win = this.windows.get(id);
        if (!win || win.state === WindowStates.MAXIMIZED) return;
        
        const oldState = win.state;
        if (!win.saved) {
            win.saved = { x: win.x, y: win.y, w: win.w, h: win.h };
        }
        win.snapZone = null;
        win.state = WindowStates.MAXIMIZED;
        win.x = 0; 
        win.y = 0;
        
        const workspace = this._getWorkspaceBounds();
        win.w = workspace.width;
        win.h = workspace.height;
        
        this._emitTransition(win, oldState, WindowStates.MAXIMIZED, 'maximizeButton', interactionSource);
        this._applyState(id);
        EventBus.emit('window.maximized', { severity: 'Info', source: 'WindowManager', message: `Window ${id} maximized`, data: { id, pid: win.pid } });
    }

    /**
     * Restores a window from a minimized or maximized state back to NORMAL.
     * If the window was previously maximized or snapped, restores its saved geometry.
     * @param {string} id - Window ID
     */
    restoreWindow(id, interactionSource = 'pointer') {
        const win = this.windows.get(id);
        if (!win) return;
        
        const oldState = win.state;
        let reason = 'restoreButton';
        if (win.state === WindowStates.MINIMIZED) {
            win.state = win.savedState || WindowStates.NORMAL;
            reason = 'taskbarRestore';
        } else if (win.state === WindowStates.MAXIMIZED) {
            win.state = WindowStates.NORMAL;
            win.snapZone = null;
            if (win.saved) {
                win.x = win.saved.x; 
                win.y = win.saved.y;
                win.w = win.saved.w; 
                win.h = win.saved.h;
                win.saved = null;
            }
            reason = 'restoreButton';
        }

        this._emitTransition(win, oldState, win.state, reason, interactionSource);
        this._applyState(id);
        EventBus.emit('window.restored', { severity: 'Info', source: 'WindowManager', message: `Window ${id} restored`, data: { id, pid: win.pid } });
    }

    /**
     * Closes and destroys a window. Removes it from the DOM and cleans up state.
     * After closing, automatically focuses the next highest z-order window.
     * @param {string} id - Window ID
     */
    closeWindow(id, interactionSource = 'system') {
        if (this.windows.has(id)) {
            const win = this.windows.get(id);
            this._emitTransition(win, win.state, 'none', 'windowClose', interactionSource);
            this._persistWindowGeometry(win);
            if (win.frame && typeof win.frame.destroy === 'function') {
                win.frame.destroy();
            } else {
                win.frame.element.remove();
            }
            this.windows.delete(id);
            this.mruFocusStack = this.mruFocusStack.filter(winId => winId !== id);
            
            if (this.activeWindowId === id) {
                const nextId = this.mruFocusStack.length > 0 ? this.mruFocusStack[0] : null;
                if (nextId) {
                    this.focusWindow(nextId);
                } else {
                    this.activeWindowId = null;
                }
            }
            
            EventBus.emit('window.closed', { severity: 'Info', source: 'WindowManager', message: `Closed window ${id}`, data: { id, pid: win.pid } });
            
            this._compressZIndex();
            this._focusTopWindow();
        }
    }

    _persistWindowGeometry(win) {
        if (!win || win.state !== WindowStates.NORMAL || !this.serviceRegistry) return;
        const userSettingsService = this.serviceRegistry.get('UserSettingsService');
        const appId = (win.options && win.options.appId) || this.pidToAppId.get(win.pid);
        if (userSettingsService && appId) {
            userSettingsService.setSetting(`window.geometry.${appId}`, {
                x: win.x,
                y: win.y,
                w: win.w,
                h: win.h
            });
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
        
        const nextMRUId = this.mruFocusStack.find(winId => {
            const w = this.windows.get(winId);
            return w && w.state !== WindowStates.MINIMIZED && winId !== this.activeWindowId;
        });
        if (nextMRUId) {
            this.focusWindow(nextMRUId);
            return;
        }

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
            
            // Maintain MRU Focus Stack order
            this.mruFocusStack = this.mruFocusStack.filter(winId => winId !== id);
            this.mruFocusStack.unshift(id);

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

    /**
     * Returns a list of window state objects ordered from Most-Recently-Used to Least-Recently-Used.
     * @returns {Array<Object>}
     */
    getMRUWindowList() {
        return this.mruFocusStack
            .map(id => this.windows.get(id))
            .filter(Boolean)
            .map(win => this.getWindowState(win.id));
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
        const appId = win.appId || (win.options && win.options.appId) || (win.pid ? this.pidToAppId.get(win.pid) : null);
        const title = win.title || (win.frame && win.frame.title) || (win.options && win.options.title) || 'Window';
        return {
            id: win.id,
            pid: win.pid,
            appId: appId,
            title: title,
            workspaceId: win.workspaceId,
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

    /**
     * Reconciles window visibility against the active workspace.
     * @param {string} activeWorkspaceId - The ID of the current active workspace.
     */
    reconcileWorkspaceVisibility(activeWorkspaceId) {
        let topWindow = null;
        let highestZ = -1;

        for (const win of this.windows.values()) {
            const belongsToWorkspace = (win.workspaceId === activeWorkspaceId);
            win.isWorkspaceVisible = belongsToWorkspace;

            if (!belongsToWorkspace) {
                if (win.frame && win.frame.element) {
                    win.frame.element.classList.add('workspace-hidden');
                }
                if (this.activeWindowId === win.id) {
                    this._blurWindow(this.activeWindowId);
                }
            } else {
                if (win.frame && win.frame.element) {
                    win.frame.element.classList.remove('workspace-hidden');
                }
                
                // Track highest z-index to automatically focus it
                if (win.state !== WindowStates.MINIMIZED) {
                    const z = parseInt(win.frame.element.style.zIndex || '0', 10);
                    if (z > highestZ) {
                        highestZ = z;
                        topWindow = win;
                    }
                }
            }
        }

        if (topWindow) {
            this.focusWindow(topWindow.id);
        } else {
            if (this.activeWindowId) {
                this._blurWindow(this.activeWindowId);
            }
        }
    }

    /**
     * Exports serializable window session state for restoration.
     * @returns {Array<Object>}
     */
    exportSessionState() {
        const list = [];
        for (const win of this.windows.values()) {
            list.push({
                id: win.id,
                pid: win.pid,
                appId: win.appId || (win.pid ? this.pidToAppId.get(win.pid) : null),
                workspaceId: win.workspaceId,
                x: win.x,
                y: win.y,
                w: win.w,
                h: win.h,
                state: win.state
            });
        }
        return list;
    }

    /**
     * Restores window positions and states from serializable session state.
     * @param {Array<Object>} serializedState 
     * @returns {boolean}
     */
    restoreSessionState(serializedState) {
        if (!Array.isArray(serializedState)) return false;
        for (const item of serializedState) {
            const win = this.windows.get(item.id);
            if (win) {
                win.x = item.x;
                win.y = item.y;
                win.w = item.w;
                win.h = item.h;
                win.state = item.state;
                win.workspaceId = item.workspaceId;
                this._applyState(item.id);
            }
        }
        return true;
    }
}
