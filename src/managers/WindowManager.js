import { WindowFrame } from '../ui/WindowFrame.js';
import { EventBus } from '../kernel/SystemEventBus.js';

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

        // Automatically close windows when a process terminates
        EventBus.on('process.terminated', (payload) => {
            if (payload.data && payload.data.pid) {
                const pid = payload.data.pid;
                const windowsToClose = Array.from(this.windows.values()).filter(w => w.pid === pid);
                windowsToClose.forEach(w => this.closeWindow(w.id));
            }
        });
        // Session state and global input policies have been extracted to InputPolicy.js
    }

    createWindow(options) {
        const id = `win-${this.nextWindowId++}`;
        const title = options.title || 'Window';
        
        // Runtime state persistence
        const winState = {
            id,
            pid: options.pid || null,
            state: 'normal',
            x: 100 + ((this.nextWindowId * 20) % 200),
            y: 100 + ((this.nextWindowId * 20) % 200),
            w: options.width || 400,
            h: options.height || 300,
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
                if (w && w.state === 'minimized') this.restoreWindow(id);
                else this.minimizeWindow(id);
            },
            onMaximize: () => {
                const w = this.windows.get(id);
                if (w && w.state === 'maximized') this.restoreWindow(id);
                else this.maximizeWindow(id);
            }
        }, options);

        winState.frame = frame;
        this.windows.set(id, winState);

        const host = document.getElementById('window-host');
        if (host) {
            host.appendChild(frame.element);
            this._applyState(id);
            this.focusWindow(id);
        }

        EventBus.emit('windowManager:create', { severity: 'Info', source: 'WindowManager', message: `Created window ${id} for ${title}`, data: { id, pid: winState.pid } });
        return { id, contentElement: frame.contentElement };
    }

    _applyState(id) {
        const win = this.windows.get(id);
        if (!win) return;
        
        win.frame.setPosition(win.x, win.y);
        win.frame.setSize(win.w, win.h);
        win.frame.setState(win.state);
    }

    moveWindow(id, dx, dy) {
        const win = this.windows.get(id);
        if (!win || win.state === 'maximized') return;
        win.x += dx;
        win.y += dy;
        this._applyState(id);
        EventBus.emit('windowManager:move', { severity: 'Info', source: 'WindowManager', message: `Moved window ${id}` });
    }

    resizeWindow(id, dx, dy, edge) {
        const win = this.windows.get(id);
        if (!win || win.state === 'maximized' || win.state === 'minimized') return;
        
        if (edge === 'right' || edge === 'bottom-right') {
            win.w = Math.max(200, win.w + dx); // min width 200
        }
        if (edge === 'bottom' || edge === 'bottom-right') {
            win.h = Math.max(150, win.h + dy); // min height 150
        }
        this._applyState(id);
        EventBus.emit('windowManager:resize', { severity: 'Info', source: 'WindowManager', message: `Resized window ${id}` });
    }

    minimizeWindow(id) {
        const win = this.windows.get(id);
        if (!win || win.state === 'minimized') return;
        
        win.savedState = win.state; // Remember if it was maximized
        win.state = 'minimized';
        this._applyState(id);
    }

    maximizeWindow(id) {
        const win = this.windows.get(id);
        if (!win || win.state === 'maximized') return;
        
        win.saved = { x: win.x, y: win.y, w: win.w, h: win.h };
        win.state = 'maximized';
        win.x = 0; 
        win.y = 0;
        
        const host = document.getElementById('window-host');
        win.w = host ? host.clientWidth : 800;
        win.h = host ? host.clientHeight : 600;
        
        this._applyState(id);
    }

    restoreWindow(id) {
        const win = this.windows.get(id);
        if (!win) return;
        
        if (win.state === 'minimized') {
            win.state = win.savedState || 'normal';
        } else if (win.state === 'maximized') {
            win.state = 'normal';
            if (win.saved) {
                win.x = win.saved.x; 
                win.y = win.saved.y;
                win.w = win.saved.w; 
                win.h = win.saved.h;
            }
        }
        this._applyState(id);
    }

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
            EventBus.emit('windowManager:close', { severity: 'Info', source: 'WindowManager', message: `Closed window ${id}`, data: { id, pid: win.pid } });
        }
    }

    focusWindow(id) {
        if (this.windows.has(id)) {
            const win = this.windows.get(id);
            win.frame.setZIndex(this.nextZIndex++);
            this.activeWindowId = id;
            
            this.windows.forEach(w => {
                w.frame.setActive(w.id === id);
            });
        }
    }
}
