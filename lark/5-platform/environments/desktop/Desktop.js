import { Environment } from '../../../3-system/Environment.js';
import { EnvironmentType } from '../../../3-system/EnvironmentType.js';
import { EventBus } from '../../../1-kernel/SystemEventBus.js';
import { LogCategory } from '../../../3-system/LogCategory.js';
import { LogSeverity } from '../../../3-system/LogSeverity.js';
import { SYSTEM_INFO } from '../../../3-system/SystemVersion.js';
import { WindowStates } from '../../../3-system/WindowStates.js';

import { WallpaperSurface } from '../../desktop/shell/WallpaperSurface.js';
import { TaskbarSurface } from '../../desktop/shell/TaskbarSurface.js';
import { NotificationSurface } from '../../desktop/shell/NotificationSurface.js';
import { SearchSurface } from '../../desktop/shell/SearchSurface.js';
import { WidgetSurface } from '../../desktop/shell/WidgetSurface.js';
import { WatermarkSurface } from '../../desktop/shell/WatermarkSurface.js';
import { ContextMenuSurface } from '../../desktop/shell/ContextMenuSurface.js';
import { DialogSurface } from '../../desktop/shell/DialogSurface.js';
import { WindowSurface } from '../../desktop/shell/WindowSurface.js';
import { WindowSwitcherSurface } from '../../desktop/shell/WindowSwitcherSurface.js';
import { OnScreenKeyboardSurface } from '../../desktop/shell/OnScreenKeyboardSurface.js';
import { PresentationEffectsBridge } from '../../desktop/shell/PresentationEffectsBridge.js';
import { DesktopPolicy } from '../../desktop/DesktopPolicy.js';

export class LdeDesktopEnvironment extends Environment {
    constructor(registry, sessionId, pid) {
        super(sessionId, EnvironmentType.DESKTOP, registry);
        this.pid = pid;
        this.username = null;

        // Session-owned DOM container
        this.container = document.createElement('div');
        this.container.className = 'lde-desktop-environment';
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.display = 'none'; // Hidden until resumed

        // Private Window Host element for Multi-Session Isolation
        this.windowHost = document.createElement('div');
        this.windowHost.className = 'lde-window-host';
        this.windowHost.style.position = 'absolute';
        this.windowHost.style.top = '0';
        this.windowHost.style.left = '0';
        this.windowHost.style.width = '100%';
        this.windowHost.style.height = '100%';
        this.windowHost.style.pointerEvents = 'none';

        // Composed Shell Components based on Policy
        const policy = new DesktopPolicy(registry);

        this.wallpaper = new WallpaperSurface();
        this.taskbar = new TaskbarSurface();
        this.notifications = new NotificationSurface();
        this.search = new SearchSurface();
        this.watermarks = new WatermarkSurface();
        this.contextMenu = new ContextMenuSurface();
        this.dialog = new DialogSurface();
        this.windowSurface = new WindowSurface();
        this.switcher = new WindowSwitcherSurface();
        this.osk = new OnScreenKeyboardSurface();
        this.presentationBridge = new PresentationEffectsBridge();
        
        this.components = [
            this.wallpaper,
            this.taskbar,
            this.notifications,
            this.search,
            this.watermarks,
            this.contextMenu,
            this.dialog,
            this.windowSurface,
            this.switcher,
            this.osk,
            this.presentationBridge
        ];

        if (policy.widgetsEnabled) {
            this.widgets = new WidgetSurface();
            this.components.push(this.widgets);
        } else {
            this.widgets = null;
        }
    }

    registerShellComponent(component) {
        if (!component) return null;
        this.components.push(component);
        return component;
    }

    async mount() {
        EventBus.emit('desktop.lifecycle', { category: LogCategory.DESKTOP, severity: LogSeverity.INFO, message: 'Initializing Desktop Environment...', source: 'Desktop' });

        const sessionService = this.registry.get('SessionService');
        const session = sessionService ? sessionService.getCurrentSession() : null;
        this.username = session ? session.user.username : 'Unknown';

        // 1. Initialize Components
        for (const component of this.components) {
            component.initialize(this.registry, this);
        }

        // 2. Assemble DOM explicitly for z-order correctness
        // Layer 1: Wallpaper
        this.wallpaper.mount(this.container);
        
        // Layer 2: Widgets (if enabled by policy)
        if (this.widgets) {
            this.widgets.mount(this.container);
        }
        
        // Layer 3: Windows
        this.container.appendChild(this.windowHost);
        
        // Layer 4: Foreground shell components
        for (const component of this.components) {
            if (component !== this.wallpaper && component !== this.widgets && typeof component.mount === 'function') {
                component.mount(this.container);
            }
        }

        // Append private container to the main desktop element
        const desktopEl = document.getElementById('desktop-host');
        if (desktopEl) {
            desktopEl.appendChild(this.container);
        }

        // Cleaned up: Context menu is now owned by WallpaperSurface
        // Cleaned up: Watermarks are now owned by WatermarkSurface

        EventBus.emit('desktop.lifecycle', { category: LogCategory.DESKTOP, severity: LogSeverity.SUCCESS, message: 'Desktop Environment mounted.', source: 'Desktop' });
        EventBus.emit('desktop.ready', { severity: 'Info', source: 'Desktop', message: 'Desktop shell is ready.', data: { sessionId: this.id } });
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
        EventBus.emit('desktop.lifecycle', { category: LogCategory.DESKTOP, severity: LogSeverity.SUCCESS, message: `Resumed Desktop Environment for user "${this.username}"`, source: 'Desktop' });
    }

    async suspend() {
        this.hide();
        for (const component of this.components) {
            component.suspend();
        }
        EventBus.emit('desktop.lifecycle', { category: LogCategory.DESKTOP, severity: LogSeverity.SUCCESS, message: `Suspended Desktop Environment for user "${this.username}"`, source: 'Desktop' });
    }

    async destroy() {
        this.container.remove();
        for (const component of this.components) {
            component.destroy();
        }
        this.components = [];
    }

    _toggleSessionWindowsVisibility(visible) {
        const windowService = this.registry.get('WindowService');
        const workspaceService = this.registry.get('WorkspaceService');

        if (windowService) {
            for (const win of windowService.windowManager.windows.values()) {
                if (win.options && win.options.sessionId === this.id) {
                    if (win.frame && win.frame.element) {
                        if (visible) {
                            // Only restore base display structure; let WindowManager classes handle hidden state
                            if (win.state !== WindowStates.MINIMIZED) {
                                win.frame.element.style.display = '';
                            }
                        } else {
                            win.frame.element.style.display = 'none';
                        }
                    }
                }
            }

            // Let WindowManager perform a full reconciliation of the current workspace
            if (visible && workspaceService) {
                windowService.windowManager.reconcileWorkspaceVisibility(workspaceService.getActiveWorkspaceId());
            }
        }
    }

    getWindowHost() {
        return this.windowHost;
    }
}

