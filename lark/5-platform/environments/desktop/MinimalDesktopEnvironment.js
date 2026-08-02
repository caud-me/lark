import { Environment } from '../../../3-system/Environment.js';
import { EnvironmentType } from '../../../3-system/EnvironmentType.js';
import { EventBus } from '../../../1-kernel/SystemEventBus.js';
import { LogCategory } from '../../../3-system/LogCategory.js';
import { LogSeverity } from '../../../3-system/LogSeverity.js';
import { WindowStates } from '../../../3-system/WindowStates.js';

import { WallpaperSurface } from '../../desktop/shell/WallpaperSurface.js';
import { SearchSurface } from '../../desktop/shell/SearchSurface.js';
import { NotificationSurface } from '../../desktop/shell/NotificationSurface.js';
import { WatermarkSurface } from '../../desktop/shell/WatermarkSurface.js';
import { ContextMenuSurface } from '../../desktop/shell/ContextMenuSurface.js';
import { DialogSurface } from '../../desktop/shell/DialogSurface.js';
import { WindowSurface } from '../../desktop/shell/WindowSurface.js';

export class MinimalDesktopEnvironment extends Environment {
    constructor(registry, sessionId) {
        super(sessionId, EnvironmentType.DESKTOP, registry);
        
        // Session-owned DOM container
        this.container = document.createElement('div');
        this.container.className = 'lde-desktop-environment omni-minimal-environment';
        
        // Private Window Host element for Multi-Session Isolation
        this.windowHost = document.createElement('div');
        this.windowHost.className = 'lde-window-host';
        this.windowHost.style.position = 'absolute';
        this.windowHost.style.top = '0';
        this.windowHost.style.left = '0';
        this.windowHost.style.width = '100%';
        this.windowHost.style.height = '100%';
        this.windowHost.style.pointerEvents = 'none';

        this.wallpaper = new WallpaperSurface();
        this.notifications = new NotificationSurface();
        this.search = new SearchSurface();
        this.watermarks = new WatermarkSurface();
        this.contextMenu = new ContextMenuSurface();
        this.dialog = new DialogSurface();
        this.windowSurface = new WindowSurface();
        
        this.components = [
            this.wallpaper,
            this.notifications,
            this.search,
            this.watermarks,
            this.contextMenu,
            this.dialog,
            this.windowSurface
        ];
    }

    async mount() {
        EventBus.emit('desktop.lifecycle', { category: LogCategory.DESKTOP, severity: LogSeverity.INFO, message: 'Initializing Minimal Desktop Environment...', source: 'MinimalDesktop' });

        // 1. Initialize Components
        for (const component of this.components) {
            component.initialize(this.registry, this);
        }

        // 2. Assemble DOM explicitly for z-order correctness
        // Layer 1: Wallpaper
        this.wallpaper.mount(this.container);
        
        // Layer 2: Windows (Skipping widget layer)
        this.container.appendChild(this.windowHost);
        
        // Layer 3: Foreground shell (Overlays, Notifications)
        this.notifications.mount(this.container);
        this.search.mount(this.container);
        this.watermarks.mount(this.container);
        this.contextMenu.mount(this.container);
        this.dialog.mount(this.container);

        // Append private container to the main desktop element
        const desktopEl = document.getElementById('desktop-host');
        if (desktopEl) {
            desktopEl.appendChild(this.container);
        }

        EventBus.emit('desktop.lifecycle', { category: LogCategory.DESKTOP, severity: LogSeverity.SUCCESS, message: 'Minimal Desktop Environment mounted.', source: 'MinimalDesktop' });

        // Notify platform that the desktop is ready and startup apps should be launched
        EventBus.emit('desktop.ready', { severity: 'Info', source: 'MinimalDesktop', message: 'Minimal Desktop shell is ready.', data: { sessionId: this.id } });
    }

    show() {
        this.container.style.display = 'block';
        this._toggleSessionWindowsVisibility(true);
    }

    hide() {
        this.container.style.display = 'none';
        this._toggleSessionWindowsVisibility(false);
    }

    async resume() {
        this.show();
        for (const component of this.components) {
            component.resume();
        }
        EventBus.emit('desktop.lifecycle', { category: LogCategory.DESKTOP, severity: LogSeverity.SUCCESS, message: `Resumed Minimal Desktop Environment`, source: 'MinimalDesktop' });
    }

    async suspend() {
        this.hide();
        for (const component of this.components) {
            component.suspend();
        }
        EventBus.emit('desktop.lifecycle', { category: LogCategory.DESKTOP, severity: LogSeverity.SUCCESS, message: `Suspended Minimal Desktop Environment`, source: 'MinimalDesktop' });
    }

    async destroy() {
        this.container.remove();
        for (const component of this.components) {
            component.destroy();
        }
        this.components = [];
    }

    getWindowHost() {
        return this.windowHost;
    }

    _toggleSessionWindowsVisibility(visible) {
        const windowService = this.registry.get('WindowService');
        if (windowService) {
            for (const win of windowService.windowManager.windows.values()) {
                if (win.options && win.options.sessionId === this.id) {
                    if (win.frame && win.frame.element) {
                        win.frame.element.style.display = visible && win.state !== WindowStates.MINIMIZED ? 'block' : 'none';
                    }
                }
            }
        }
    }
}
