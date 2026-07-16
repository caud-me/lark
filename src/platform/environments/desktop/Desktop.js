import { Environment } from '../../../system/Environment.js';
import { EnvironmentType } from '../../../system/EnvironmentType.js';
import { Taskbar } from '../../desktop/shell/Taskbar.js';
import { NotificationCenter } from '../../notifications/NotificationCenter.js';
import { Wallpaper } from '../../desktop/shell/Wallpaper.js';
import { CommandPalette } from '../../search/CommandPalette.js';
import { EventBus } from '../../../kernel/SystemEventBus.js';
import { WindowStates } from '../../../system/WindowStates.js';
import { LogCategory } from '../../../system/LogCategory.js';
import { LogSeverity } from '../../../system/LogSeverity.js';
import { SYSTEM_INFO } from '../../../system/SystemVersion.js';

export class Desktop extends Environment {
    constructor(registry, sessionId, pid) {
        super(sessionId, EnvironmentType.DESKTOP, registry);
        this.pid = pid;
        this.username = null;

        // Presentation elements
        this.wallpaper = null;
        this.taskbar = null;
        this.notificationCenter = null;
        this.commandPalette = null;
        this.widgetLayer = null;

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

        this.container.appendChild(this.windowHost);

        // State trackers
        this.activePid = null;
        this.currentSearchAbort = null;
        this.windowStates = new Map();
        this.activeWidgets = new Map();
        this.shortcuts = [];
    }

    async mount() {
        EventBus.emit('desktop.lifecycle', { category: LogCategory.DESKTOP, severity: LogSeverity.INFO, message: 'Initializing Desktop Environment...', source: 'Desktop' });

        const sessionService = this.registry.get('SessionService');
        const session = sessionService ? sessionService.getCurrentSession() : null;
        this.username = session ? session.user.username : 'Unknown';

        // 1. Instantiate UI Components
        this.wallpaper = new Wallpaper(this.registry);
        this.notificationCenter = new NotificationCenter(this.registry);

        const processService = this.registry.get('ProcessService');
        const windowService = this.registry.get('WindowService');

        this.taskbar = new Taskbar(
            (appId) => {
                if (processService) {
                    processService.startProcess(appId, { sessionId: this.id });
                }
            },
            (pid) => {
                if (windowService) windowService.toggleWindowByPid(pid);
            },
            (action) => {
                const powerService = this.registry.get('PowerService');
                if (!powerService) return;
                switch (action) {
                    case 'lock': powerService.lock(); break;
                    case 'logout': powerService.logout(); break;
                    case 'reboot': powerService.reboot(); break;
                    case 'shutdown': powerService.shutdown(); break;
                }
            }
        );

        // 2. Setup Widget Layer
        this.widgetLayer = document.createElement('div');
        this.widgetLayer.id = 'lde-widget-layer';
        this.widgetLayer.style.position = 'absolute';
        this.widgetLayer.style.top = '0';
        this.widgetLayer.style.left = '0';
        this.widgetLayer.style.width = '100%';
        this.widgetLayer.style.height = '100%';
        this.widgetLayer.style.pointerEvents = 'none';
        this.widgetLayer.style.zIndex = '0';

        // 3. Spotlight Search
        this.commandPalette = new CommandPalette({
            onSearch: async (query) => {
                if (this.currentSearchAbort) this.currentSearchAbort.abort();
                const ac = new AbortController();
                this.currentSearchAbort = ac;

                const searchService = this.registry.get('SearchService');
                if (!searchService) return;

                this.commandPalette.update([], true);

                try {
                    for await (const batch of searchService.search(query, { signal: ac.signal })) {
                        if (ac.signal.aborted) break;
                        this.commandPalette.update(batch, false);
                    }
                } catch (e) {
                    if (e.name !== 'AbortError') console.error('[Desktop] Search error:', e);
                }
            },
            onSelect: (result) => {
                const searchService = this.registry.get('SearchService');
                if (searchService) searchService.activate(result);
            },
            onClose: () => {
                if (this.currentSearchAbort) this.currentSearchAbort.abort();
            }
        });

        // 4. Assemble DOM under our private container
        this.container.insertBefore(this.wallpaper.element, this.windowHost);
        this.container.insertBefore(this.widgetLayer, this.windowHost);
        this.container.appendChild(this.taskbar.element);
        this.container.appendChild(this.notificationCenter.container);
        this.container.appendChild(this.commandPalette.element);

        // Append private container to the main desktop element
        const desktopEl = document.getElementById('desktop-host');
        if (desktopEl) {
            desktopEl.appendChild(this.container);
        }

        // 4.2. Desktop Context Menu
        this.container.addEventListener('contextmenu', async (e) => {
            if (e.target !== this.wallpaper.element && e.target !== this.container && e.target !== this.widgetLayer) return;
            
            e.preventDefault();
            
            const contextMenuService = this.registry.get('ContextMenuService');
            if (!contextMenuService) return;
            
            const actions = [
                { id: 'refresh', label: 'Refresh Desktop', icon: '🔄' },
                { id: 'personalize', label: 'Personalize', icon: '🎨' }
            ];
            
            const result = await contextMenuService.showMenu(e.clientX, e.clientY, actions);
            if (result) {
                if (result === 'refresh') {
                    this.renderShell();
                    this.renderWidgets();
                    // Provide feedback so the user knows it worked
                    const notificationService = this.registry.get('NotificationService');
                    if (notificationService) {
                        notificationService.show('Desktop Refreshed', 'The shell has been successfully refreshed.', 'system');
                    }
                } else if (result === 'personalize') {
                    const intentService = this.registry.get('ApplicationIntentService');
                    if (intentService) {
                        intentService.launchWithIntent('sys.settings', { type: 'settings.openPage', payload: { page: 'personalization' } });
                    }
                }
            }
        });

        // 4.5. Register Shortcuts
        const shortcutService = this.registry.get('ShortcutService');
        if (shortcutService) {
            const cmdShortcut = {
                shortcut: 'Ctrl+Space',
                scope: 'GLOBAL',
                handler: () => {
                    if (this.commandPalette) this.commandPalette.toggle();
                }
            };
            shortcutService.register(cmdShortcut);
            this.shortcuts.push(cmdShortcut);
        }

        // Render wallpaper, widgets, and taskbar
        this.renderWidgets();
        this.renderShell();

        // 5. Safe Mode watermark
        const recoveryService = this.registry.get('RecoveryService');
        const safeMode = recoveryService ? recoveryService.isSafeMode() : false;
        if (safeMode) {
            this._renderSafeModeWatermarks();
        } else {
            this._renderDevBuild();
        }

        // 6. Bind Event listeners
        this._bindEvents();

        EventBus.emit('desktop.lifecycle', { category: LogCategory.DESKTOP, severity: LogSeverity.SUCCESS, message: 'Desktop Environment mounted.', source: 'Desktop' });

        // Notify platform that the desktop is ready and startup apps should be launched
        EventBus.emit('desktop.ready', { severity: 'Info', source: 'Desktop', message: 'Desktop shell is ready.', data: { sessionId: this.id } });
    }

    _renderSafeModeWatermarks() {
        const positions = [
            { top: '12px', left: '12px' },
            { top: '12px', right: '12px' },
            { bottom: '48px', left: '12px' },
            { bottom: '48px', right: '12px' }
        ];
        
        positions.forEach(pos => {
            const watermark = document.createElement('p');
            watermark.textContent = 'Safe Mode';
            watermark.style.position = 'absolute';
            Object.assign(watermark.style, pos);
            watermark.style.color = '#80808080)';
            watermark.style.pointerEvents = 'none';
            this.container.appendChild(watermark);
        });
    }

    _renderDevBuild() {
        const watermark = document.createElement('p');
        watermark.innerHTML = `${SYSTEM_INFO.name}<br>${SYSTEM_INFO.version}<br>Release preview, report for issues.`;
        watermark.style.position = 'absolute';
        watermark.style.color = '#80808080)';
        watermark.style.bottom = '48px'
        watermark.style.right = '12px'
        watermark.style.textAlign = 'right'
        watermark.style.pointerEvents = 'none';
        this.container.appendChild(watermark);
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
        
        // Restore focus
        if (this.activePid) {
            const windowService = this.registry.get('WindowService');
            if (windowService) {
                windowService.focusWindowByPid(this.activePid);
            }
        }

        // Resume widgets
        for (const active of this.activeWidgets.values()) {
            if (active.component.resume) {
                active.component.resume();
            }
        }

        EventBus.emit('desktop.lifecycle', { category: LogCategory.DESKTOP, severity: LogSeverity.SUCCESS, message: `Resumed Desktop Environment for user "${this.username}"`, source: 'Desktop' });
    }

    async suspend() {
        this.hide();

        // Stop desktop timers / active searches
        if (this.currentSearchAbort) {
            this.currentSearchAbort.abort();
            this.currentSearchAbort = null;
        }

        // Remove focus explicitly
        if (this.activePid) {
            const windowService = this.registry.get('WindowService');
            if (windowService && typeof windowService.blurWindowByPid === 'function') {
                windowService.blurWindowByPid(this.activePid);
            }
        }

        // Suspend widgets
        for (const active of this.activeWidgets.values()) {
            if (active.component.suspend) {
                active.component.suspend();
            }
        }

        EventBus.emit('desktop.lifecycle', { category: LogCategory.DESKTOP, severity: LogSeverity.SUCCESS, message: `Suspended Desktop Environment for user "${this.username}"`, source: 'Desktop' });
    }

    async destroy() {
        this.container.remove();
        this.wallpaper.destroy();
        this.taskbar.destroy();
        
        // Remove event handlers
        this._unbindEvents();

        // Unregister Shortcuts
        const shortcutService = this.registry.get('ShortcutService');
        if (shortcutService && this.shortcuts) {
            this.shortcuts.forEach(s => shortcutService.unregister(s));
            this.shortcuts = [];
        }
        
        // Cleanup widgets
        for (const active of this.activeWidgets.values()) {
            if (active.component.unmount) active.component.unmount();
            if (active.component.destroy) active.component.destroy();
            active.container.remove();
        }
        this.activeWidgets.clear();
        this.widgetLayer.remove();
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

    renderWidgets = async () => {
        const recoveryService = this.registry.get('RecoveryService');
        const safeMode = recoveryService ? recoveryService.isSafeMode() : false;
        if (safeMode) return;

        const widgetService = this.registry.get('WidgetService');
        const capabilityService = this.registry.get('CapabilityService');
        if (!widgetService) return;

        const instances = widgetService.getWidgets();
        const available = widgetService.getAvailableWidgets();
        
        // Remove unmounted instances
        const currentIds = new Set(instances.map(w => w.instanceId));
        for (const [id, active] of this.activeWidgets.entries()) {
            if (!currentIds.has(id)) {
                if (active.component.unmount) active.component.unmount();
                if (active.component.destroy) active.component.destroy();
                active.container.remove();
                this.activeWidgets.delete(id);
            }
        }

        // Mount or update instances
        for (const instance of instances) {
            let active = this.activeWidgets.get(instance.instanceId);
            
            if (!active) {
                const manifest = available.find(m => m.id === instance.widgetId);
                if (!manifest || !manifest.modulePath) continue;

                try {
                    const module = await import(manifest.modulePath);
                    if (!module.Widget) continue;
                    
                    const component = new module.Widget();
                    const container = document.createElement('div');
                    container.style.position = 'absolute';
                    container.style.pointerEvents = 'auto';
                    
                    if (component.initialize) {
                        component.initialize(instance.config || {}, capabilityService);
                    }
                    
                    this.widgetLayer.appendChild(container);
                    if (component.mount) {
                        component.mount(container);
                    }
                    
                    active = { instance, component, container };
                    this.activeWidgets.set(instance.instanceId, active);
                } catch (e) {
                    console.error(`[Desktop] Failed to load widget ${instance.widgetId}`, e);
                    continue;
                }
            }

            active.container.style.left = `${instance.x}px`;
            active.container.style.top = `${instance.y}px`;
            active.container.style.width = `${instance.width}px`;
            active.container.style.height = `${instance.height}px`;

            if (active.component.update && JSON.stringify(active.instance.config) !== JSON.stringify(instance.config)) {
                active.component.update(instance.config || {});
            }
            active.instance = instance;
        }
    };

    renderShell = () => {
        const applicationService = this.registry.get('ApplicationService');
        const processService = this.registry.get('ProcessService');
        const sessionService = this.registry.get('SessionService');

        if (!applicationService || !processService) return;

        const allApps = applicationService.getInstalledApplications();
        const launcherApps = allApps.filter(a => !a.hidden);
        launcherApps.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));

        const procs = processService.getProcesses();
        const running = [];

        for (const p of procs) {
            const appDef = applicationService.getApplication(p.appId);
            if (appDef && !appDef.hidden && p.sessionId === this.id) {
                running.push({
                    pid: p.pid,
                    appId: p.appId,
                    appName: appDef.title || appDef.name,
                    isActive: this.activePid === p.pid,
                    isMinimized: this.windowStates.get(p.pid) === WindowStates.MINIMIZED
                });
            }
        }

        this.taskbar.render({
            launcher: launcherApps,
            running: running,
            activePid: this.activePid,
            session: sessionService ? sessionService.getCurrentSession() : null,
            widgets: {}
        });
    };

    _bindEvents() {
        this._onWidgetChanged = this.renderWidgets.bind(this);
        this._onThemeChanged = (payload) => {
            const theme = payload.data?.theme || 'unknown';
            for (const active of this.activeWidgets.values()) {
                if (active.component.onThemeChanged) {
                    active.component.onThemeChanged(theme);
                }
            }
        };

        this._onWindowFocused = (payload) => {
            if (payload.data && payload.data.pid) {
                const processService = this.registry.get('ProcessService');
                const proc = processService ? processService.getProcess(payload.data.pid) : null;
                if (proc && proc.sessionId === this.id) {
                    this.activePid = payload.data.pid;
                    this.windowStates.set(this.activePid, WindowStates.NORMAL);
                    this.renderShell();
                }
            }
        };

        this._onWindowBlurred = (payload) => {
            if (payload.data && payload.data.pid === this.activePid) {
                this.activePid = null;
                this.renderShell();
            }
        };

        this._onWindowMinimized = (payload) => {
            if (payload.data && payload.data.pid) {
                const processService = this.registry.get('ProcessService');
                const proc = processService ? processService.getProcess(payload.data.pid) : null;
                if (proc && proc.sessionId === this.id) {
                    this.windowStates.set(payload.data.pid, WindowStates.MINIMIZED);
                    if (this.activePid === payload.data.pid) this.activePid = null;
                    this.renderShell();
                }
            }
            if (payload.data && payload.data.id) {
                const winEl = document.getElementById(payload.data.id);
                if (winEl && winEl.parentNode === this.windowHost) winEl.style.display = 'none';
            }
        };

        this._onWindowRestored = (payload) => {
            if (payload.data && payload.data.pid) {
                const processService = this.registry.get('ProcessService');
                const proc = processService ? processService.getProcess(payload.data.pid) : null;
                if (proc && proc.sessionId === this.id) {
                    this.windowStates.set(payload.data.pid, WindowStates.NORMAL);
                    this.renderShell();
                }
            }
            if (payload.data && payload.data.id) {
                const winEl = document.getElementById(payload.data.id);
                if (winEl && winEl.parentNode === this.windowHost) winEl.style.display = '';
            }
        };

        this._onWindowClosed = (payload) => {
            if (payload.data && payload.data.pid) {
                this.windowStates.delete(payload.data.pid);
                if (this.activePid === payload.data.pid) this.activePid = null;
                this.renderShell();
            }
        };

        this._onProcessLifecycle = () => this.renderShell();

        EventBus.on('widget.changed', this._onWidgetChanged);
        EventBus.on('theme.changed', this._onThemeChanged);
        EventBus.on('window.focused', this._onWindowFocused);
        EventBus.on('window.blurred', this._onWindowBlurred);
        EventBus.on('window.minimized', this._onWindowMinimized);
        EventBus.on('window.restored', this._onWindowRestored);
        EventBus.on('window.maximized', this._onWindowRestored);
        EventBus.on('window.closed', this._onWindowClosed);
        EventBus.on('window.created', this._onProcessLifecycle);
        EventBus.on('process.started', this._onProcessLifecycle);
        EventBus.on('process.terminated', this._onProcessLifecycle);
        EventBus.on('application.database.changed', this._onProcessLifecycle);
    }

    _unbindEvents() {
        EventBus.off('widget.changed', this._onWidgetChanged);
        EventBus.off('theme.changed', this._onThemeChanged);
        EventBus.off('window.focused', this._onWindowFocused);
        EventBus.off('window.blurred', this._onWindowBlurred);
        EventBus.off('window.minimized', this._onWindowMinimized);
        EventBus.off('window.restored', this._onWindowRestored);
        EventBus.off('window.maximized', this._onWindowRestored);
        EventBus.off('window.closed', this._onWindowClosed);
        EventBus.off('window.created', this._onProcessLifecycle);
        EventBus.off('process.started', this._onProcessLifecycle);
        EventBus.off('process.terminated', this._onProcessLifecycle);
        EventBus.off('application.database.changed', this._onProcessLifecycle);
    }
}

export default {
    run: async (registry, pid) => {
        const sessionService = registry.get('SessionService');
        const session = sessionService ? sessionService.getCurrentSession() : null;
        if (!session) return;

        const desktopEnvService = registry.get('DesktopEnvironmentService');
        const desktop = new Desktop(registry, session.id, pid);
        if (desktopEnvService) {
            desktopEnvService.environments.set(session.id, desktop);
        }
    }
};
